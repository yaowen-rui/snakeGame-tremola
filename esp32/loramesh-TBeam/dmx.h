// dmx.h

// tinySSB for ESP32
// (c) 2022-2023 <christian.tschudin@unibas.ch>

// FIXME: in the code, rename blob to chunk (blb_s, blbt,  etc)

#if !defined(_INCLUDE_DMX_H)
#define _INCLUDE_DMX_H

#define DMXT_SIZE   (4+GOSET_MAX_KEYS) // we need place for want (1 per feed),
                                       // plus misc protocols (GOset, mgmt, WANT, CHNK)
#define BLBT_SIZE   100                // this size is a guess
#define DMX_PFX     "tinyssb-v0"

struct dmx_s {
  unsigned char dmx[DMX_LEN];
  void (*fct)(unsigned char*, int, unsigned char *aux, struct face_s *f);
  unsigned char *fid;
  // int ndx;
  int seq;
};

struct blb_s {
  unsigned char h[HASH_LEN];
  void (*fct)(unsigned char*, int, int, struct face_s *f);
  struct chain_s *front;
  // unsigned char *fid;
  // int seq;
  // int bnr;
  // int last_bnr;
};

struct chain_s {
  struct chain_s *next;
  unsigned char *fid;
  unsigned short seq;
  unsigned short cnr;
  unsigned short last_cnr;
};

class DmxClass {
 public:
  struct dmx_s dmxt[DMXT_SIZE];
  int dmxt_cnt;
  struct blb_s blbt[BLBT_SIZE];
  int blbt_cnt;

  unsigned char goset_dmx[DMX_LEN];
  unsigned char want_dmx[DMX_LEN];
  unsigned char chnk_dmx[DMX_LEN];
  unsigned char mgmt_dmx[DMX_LEN];

  int _dmxt_index(unsigned char *dmx);
  int _blbt_index(unsigned char *h);
  void arm_dmx(unsigned char *dmx,
               void (*fct)(unsigned char*, int, unsigned char*,
                           struct face_s*)=NULL,
               unsigned char *aux=NULL, /*int ndx=-1,*/ int seq=0);
  void arm_blb(unsigned char *h,
               void (*fct)(unsigned char*, int, int, struct face_s*)=NULL,
               unsigned char *fid=NULL, int seq=-1, int bnr=-1, int last=0);
  void compute_dmx(unsigned char *dst, unsigned char *buf, int len);
  int on_rx(unsigned char *buf, int len, struct face_s *f);
  void set_want_dmx();
  // void invalidate(); // clears all entries with aux!=NULL
};

#endif

// eof
