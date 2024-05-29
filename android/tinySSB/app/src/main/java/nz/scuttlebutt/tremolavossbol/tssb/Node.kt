package nz.scuttlebutt.tremolavossbol.tssb

import android.content.Context
import android.util.Log
import nz.scuttlebutt.tremolavossbol.MainActivity
import nz.scuttlebutt.tremolavossbol.utils.Bipf
import nz.scuttlebutt.tremolavossbol.utils.Bipf.Companion.BIPF_INT
import nz.scuttlebutt.tremolavossbol.utils.Bipf.Companion.BIPF_LIST
import nz.scuttlebutt.tremolavossbol.utils.Bipf.Companion.bipf_loads
import nz.scuttlebutt.tremolavossbol.utils.Bipf.Companion.varint_decode
import nz.scuttlebutt.tremolavossbol.utils.Constants
import nz.scuttlebutt.tremolavossbol.utils.Constants.Companion.DMX_LEN
import nz.scuttlebutt.tremolavossbol.utils.Constants.Companion.HASH_LEN
import nz.scuttlebutt.tremolavossbol.utils.Constants.Companion.PKTTYPE_chain20
import nz.scuttlebutt.tremolavossbol.utils.Constants.Companion.TINYSSB_PKT_LEN
import nz.scuttlebutt.tremolavossbol.utils.HelperFunctions
import nz.scuttlebutt.tremolavossbol.utils.HelperFunctions.Companion.decodeHex
import nz.scuttlebutt.tremolavossbol.utils.HelperFunctions.Companion.toByteArray
import nz.scuttlebutt.tremolavossbol.utils.HelperFunctions.Companion.toHex
import java.io.File
import java.io.RandomAccessFile
import java.util.concurrent.locks.ReentrantLock

class Node(val context: MainActivity) {
    val NODE_ROUND_LEN = 5000L
    var log_offs = 0
    var chunk_offs = 0

    private val wantAccessLock = Any()

    fun incoming_want_request(buf: ByteArray, aux: ByteArray?, sender: String?) {
        Log.d("node", "incoming WANT ${buf.toHex()} from sender: $sender")
        val vect = bipf_loads(buf.sliceArray(DMX_LEN..buf.lastIndex))
        if (vect == null || vect.typ != BIPF_LIST) return
        val lst = vect.getBipfList()
        if (lst.size < 1 || lst[0].typ != BIPF_INT) {
            Log.d("node", "incoming WANT error with offset")
            return
        }
        val offs = lst[0].getInt()
        var v = "WANT vector=["
        var vector = mutableMapOf<Int, Int>() //send to frontend
        var credit = 3
        for (i in 1..lst.lastIndex) {
            val fid: ByteArray
            var seq: Int
            try {
                val ndx = (offs + i - 1) % context.tinyGoset.keys.size
                fid = context.tinyGoset.keys[ndx]
                seq = lst[i].getInt()
                v += " $ndx.${seq}"
                vector[ndx] = seq
            } catch (e: Exception) {
                Log.d("node", "incoming WANT error ${e.toString()}")
                continue
            }
            // Log.d("node", "want ${fid.toHex()}.${seq}")
            while (credit > 0) {
                val pkt = context.tinyRepo.feed_read_pkt(fid, seq)
                //Log.d("incoming_want", "read pkt ${fid.toHex()}.$seq")
                if (pkt == null) {
                    //Log.d("incoming_want", "pkt not found")
                    break
                }

                Log.d("node", "  have entry ${fid.toHex()}.${seq} with dmx: ${pkt.sliceArray(0 until DMX_LEN).toHex()} (len: ${pkt.size})")
                context.tinyIO.enqueue(pkt)
                seq++;
                credit--;
            }
        }
        v += " ]"
        Log.d("node", v)
        if(sender != null)
            update_progress(vector.toSortedMap().values.toList(), sender)
        if (credit == 3)
            Log.d("node", "  no entry found to serve")
    }

    fun incoming_chunk_request(buf: ByteArray, aux: ByteArray?) {
        Log.d("node", "incoming CHNK request")
        val vect = bipf_loads(buf.sliceArray(DMX_LEN..buf.lastIndex))
        if (vect == null || vect.typ != BIPF_LIST) {
            Log.d("node", "  malformed?")
            return
        }
        var v= "CHNK vector=["
        var credit = 3
        for (e in vect.getBipfList()) {
            val fNDX: Int
            val fid: ByteArray
            val seq: Int
            var cnr: Int
            try {
                Log.d("in_chnk", "inner")
                val lst = e.getBipfList()
                fNDX = lst[0].getInt()
                fid = context.tinyGoset.keys[fNDX]
                seq = lst[1].getInt()
                cnr = lst[2].getInt()
                v += " ${fid.sliceArray(0..9).toHex()}.${seq}.${cnr}"
            } catch (e: Exception) {
                Log.d("node", "incoming CHNK error ${e.toString()}")
                continue
            }
            val pkt = context.tinyRepo.feed_read_pkt(fid, seq)
            if (pkt == null || pkt[DMX_LEN].toInt() != PKTTYPE_chain20) continue;
            val (sz, szlen) = varint_decode(pkt, DMX_LEN + 1, DMX_LEN + 4)
            if (sz <= 28 - szlen) continue;
            val maxChunks    = (sz - (28 - szlen) + 99) / 100
            Log.d("node", "maxChunks is ${maxChunks}")
            if (cnr > maxChunks) continue
            while (cnr <= maxChunks && credit-- > 0) {
                val chunk = context.tinyRepo.feed_read_chunk(fid, seq, cnr)
                if (chunk == null) break;
                Log.d("node", "  have chunk ${fid.sliceArray(0..19).toHex()}.${seq}.${cnr}")
                context.tinyIO.enqueue(chunk);
                cnr++;
            }
        }
        v += " ]"
        Log.d("node", v)
    }

    fun loop(lck: ReentrantLock) {
        while (true) {
            lck.lock()
            beacon()
            lck.unlock()
            Thread.sleep(NODE_ROUND_LEN)
        }
    }

    fun beacon() { // called in regular intervals

        Log.d("node", "beacon")

        val want_buf = context.tinyRepo.mk_want_vect()
        if (want_buf != null)
            context.tinyIO.enqueue(want_buf, context.tinyDemux.want_dmx)

        val chnk_buf = context.tinyRepo.mk_chnk_vect()
        if (chnk_buf != null)
            context.tinyIO.enqueue(chnk_buf, context.tinyDemux.chnk_dmx)
    }

    fun incoming_pkt(buf: ByteArray, fid: ByteArray) {
        Log.d("node", "incoming logEntry ${buf.size}B, fid: ${fid.toHex()}")
        if (buf.size != TINYSSB_PKT_LEN) return
        context.tinyRepo.feed_append(fid, buf)
    }

    fun incoming_chunk(buf: ByteArray, fid: ByteArray?, seq: Int) {
        Log.d("node", "incoming chunk ${buf.size}B, fid=${fid?.toHex()}, seq=${seq}")
        if (fid == null) return
        if (buf.size != TINYSSB_PKT_LEN) return
        context.tinyRepo.sidechain_append(buf, fid, seq)
    }

    fun publish_public_content(content: ByteArray) {
        val repo = context.tinyRepo
        Log.d("node", "publish_public_content ${content.size}B")
        val seq = repo.mk_logEntry(content)
        //Log.d("node", "publish_public_content --> pkt ${if (pkt == null) 0 else pkt.size}B")
        //Log.d("node", "publish_public_content --> content ${if (pkt == null) 0 else pkt.toHex()}B")
        //if (pkt == null) return false
        //return repo.feed_append(pkt, context.idStore.identity.verifyKey)
    }

    // all want vectors are sorted by the keys
    var wants = mutableMapOf<String, Pair<List<Int>, Long>>()  // from (device address): ( [want vector], timestamp)
    var max_want: List<Int>? = null
    var min_want: List<Int>? = null
    var old_want: List<Int>? = null
    var old_min: List<Int>? = null
    var old_min_from: String? = null



    // calculates current replication progress and sends update to frontend
    fun update_progress(want_vector: List<Int>, from: String) {

        if (!context.wai.frontend_ready)
            return

        var wantsChanged = false // if want vectors did change

        synchronized(wantAccessLock) {
            val iterator = wants.iterator()
            while (iterator.hasNext()) {
                val (k, v) = iterator.next()
                val (_, ts) = v
                if (System.currentTimeMillis() - ts > 30000 && k != from && k != "me") {
                    iterator.remove() // Safely remove the element using the iterator
                    print("remove old want")
                    wantsChanged = true
                }
            }
            if(wants[from]?.first != want_vector)
                wantsChanged = true
            wants[from] = Pair(want_vector, System.currentTimeMillis())

            if(!wantsChanged)
                return


            val all_vectors = wants.values.map { it.first }
            val new_max_want = all_vectors.reduce{acc, curr -> if (acc.size >= curr.size) acc else curr }.toMutableList() //return want vector with most entries
            val new_min_want = new_max_want.toMutableList()

            for (vec in all_vectors) {
                for (i in vec.indices) {
                    if(vec[i] > new_max_want[i]) {
                        new_max_want[i] = vec[i]
                    }

                    if(vec[i] < new_min_want[i]) {
                        new_min_want[i] = vec[i]
                    }
                }
            }

            var updated = false
            if (max_want != new_max_want) {
                old_want = wants["me"]?.first
                max_want = new_max_want
                updated = true
            }

            if (min_want != new_min_want) {
                if ((((new_min_want.sum()) < (old_min?.sum() ?: 0)) || (min_want == null) || !wants.containsKey(old_min_from)) && from != "me") {
                    old_min = new_min_want
                    old_min_from = from
                }
                min_want = new_min_want
                updated = true
            }

            if (updated || from == "me") {
                val min_want_entries = min_want?.sum() ?: 0
                val old_want_entries = old_want?.sum() ?: 0
                val old_min_entries = old_min?.sum() ?:0
                val curr_want_entries = wants["me"]?.first?.sum() ?: 0
                val max_want_entries = max_want?.sum() ?: 0

                Log.d("node","notify frontend: $min_want_entries, $old_min_entries, $old_want_entries, $curr_want_entries, $max_want_entries")

                context.wai.eval("b2f_update_progress($min_want_entries, $old_min_entries, $old_want_entries, $curr_want_entries, $max_want_entries)")
            }
        }

    }
}