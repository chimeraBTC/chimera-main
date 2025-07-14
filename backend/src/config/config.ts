/**
 * Configuration Module
 * 
 * @module Config
 * @description
 * This module centralizes all configuration settings for the CHIMERA backend.
 * It handles environment variables, network configurations, and application constants.
 * Environment variables are loaded from .env file using dotenv.
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Server Configuration
export const PORT = process.env.PORT || 8001;

// Authentication Configuration
export const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";

// Environment Configuration
export const TEST_MODE = true;  // Toggle between test and production environments

// Database Configuration
export const MONGO_URL = process.env.MONGO_URI;  // MongoDB connection string

// Mempool API Configuration
/**
 * Mempool API endpoint URL
 * Testnet: https://mempool.space/testnet4/api
 * Mainnet: https://mempool.space/api
 */
export const MEMPOOL_API = TEST_MODE
  ? "https://mempool.space/testnet4/api"  // Testnet API endpoint
  : "https://mempool.space/api";           // Mainnet API endpoint

// Smart Contract Configuration

/**
 * Primary smart contract public key
 * Used for main contract interactions in the application
 * Testnet: 393cd8d2c014d9e25b31a8a8407ff00986d9f84f40055545aacab3f05dd93240
 * Mainnet: 393cd8d2c014d9e25b31a8a8407ff00986d9f84f40055545aacab3f05dd93240
 */
export const SMART_CONTRACT_PUBKEY = TEST_MODE
  ? "393cd8d2c014d9e25b31a8a8407ff00986d9f84f40055545aacab3f05dd93240"  // Testnet contract
  : "393cd8d2c014d9e25b31a8a8407ff00986d9f84f40055545aacab3f05dd93240";  // Mainnet contract

/**
 * Account public key for main contract interactions
 * Testnet: 55825877dc8d4b0294aef822e685289ddebcdbcdb48909c3fbbe5fa8e95d68b
 * Mainnet: (to be configured)
 */
export const ACCOUNT_PUBKEY = TEST_MODE
  ? "5eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109"  // Testnet account (32-byte public key)
  : "";  // Mainnet account (to be configured)

/**
 * Swap-specific smart contract public key
 * Used for token swap operations
 * Testnet: 91d402e0373f71cd86ca53bc623912bb47a350015bcf5aafa7be9e3fc202e895
 * Mainnet: 91d402e0373f71cd86ca53bc623912bb47a350015bcf5aafa7be9e3fc202e895
 */
export const SMART_CONTRACT_PUBKEY_SWAP = TEST_MODE
  ? "91d402e0373f71cd86ca53bc623912bb47a350015bcf5aafa7be9e3fc202e895"  // Testnet swap contract
  : "91d402e0373f71cd86ca53bc623912bb47a350015bcf5aafa7be9e3fc202e895";  // Mainnet swap contract

/**
 * Account public key for swap operations
 * Testnet: 7a1fcbe1f3b73b8bb75b6b1b4e7dc11ae55196dc8edd8c7fb69ba05290bebe2f
 * Mainnet: (to be configured)
 */
export const ACCOUNT_PUBKEY_SWAP = TEST_MODE
  ? "7a1fcbe1f3b73b8bb75b6b1b4e7dc11ae55196dc8edd8c7fb69ba05290bebe2f"  // Testnet swap account
  : "";  // Mainnet swap account (to be configured)

// RPC Configuration

/**
 * URL for the Arch RPC endpoint
 * Local development: http://localhost:9002
 * Production: (to be configured)
 * Local development uses localhost, while production uses Arch network
 */
// export const RPC_URL = TEST_MODE ? "http://rpc-01.test.arch.network" : "";
export const RPC_URL = TEST_MODE 
  ? "http://127.0.0.1:9002"  // Local Arch RPC endpoint
  : "http://127.0.0.1:9002";  // Production RPC (to be configured)

// Gomaestro API Configuration
export const GOMAESTRO_URL = TEST_MODE
  ? "https://xbt-testnet.gomaestro-api.org/v0"  // Testnet Gomaestro
  : "https://xbt-mainnet.gomaestro-api.org/v0";  // Mainnet Gomaestro

// Gomaestro private key for API authentication
export const GOMAESTRO_PRIVATE_KEY = process.env.GOMAESTRO_PRIVATE_KEY;

// Transaction Configuration
export const SIGNATURE_SIZE = 126;  // Expected size of ECDSA signatures in bytes
export const MAX_RETRIES = 3;  // Maximum number of retries for failed operations

// System Constants
export const SYSTEM_SMART_CONTRACT =
  "0000000000000000000000000000000000000000000000000000000000000001";  // Default system contract address

// Rune Token Configuration

/** Default amount of Rune tokens to use in swap operations */
export const runeSwapAmount = 100000;

/** Base Rune ID used in the application */
export const runeId = "89368:422";

// Rune Token IDs for different assets in the system
// Format: "BLOCK:TX_INDEX"

export const SOURCE_RUNE_TOKEN_ID = "72801:1000";  // Source token for swaps
export const FIRST_RUNE_TOKEN_ID = "72795:1082";   // First token in the system
export const SECOND_RUNE_TOKEN_ID = "72801:1001";  // Second token in the system
export const THIRD_RUNE_TOKEN_ID = "72801:1007";   // Third token in the system
export const FORTH_RUNE_TOKEN_ID = "72801:1004";   // Fourth token in the system
export const FIFTH_RUNE_TOKEN_ID = "72801:1003";   // Fifth token in the system
export const SIXTH_RUNE_TOKEN_ID = "72801:1002";   // Sixth token in the system
export const SEVENTH_RUNE_TOKEN_ID = "72801:1008";
export const EIGHTH_RUNE_TOKEN_ID = "72801:1005";
export const NINTH_RUNE_TOKEN_ID = "72801:1006";
export const WL_CNT = 2;
export const NORMAL_CNT = 1;
export const START_TIME = 1739383200000;
export const WLList = [
  "tb1pmu2dxwm736cewa4m4qgz2msfff027s5el5c0cesvn882wc9qxhwqsk2hl9",
  "tb1pyd6sv7jy29gex33c2yxf5hldqm8vqnfpr9mt2cecq06pzv9mhr2s4svgdq",
  "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy",
  "tb1pgda5khhwqlc7jmdzn4plca3pa4m7jg38zcspj0mmuyk8hnj5pphskers72",
  "tb1py67pa6gl3hj530sefdt9t9up5ca2jtcl7rx8yuuhrg3zrwx0fe4q2zmumw",
  "tb1pfhkhcq9h4a3m90r6q5a60vyu566ckz660h40pp69ex38hhmvjvqqw33c6m",
  "tb1p4xpshuueas0msm0zcv4sas93plue8cw2aep64l3f3k890knnrshss2qkzn",
  "tb1peyaun3wj574rxkxr7m5ksqgjwxrfytkcws9kjlt5xrvte4nyhgyqmy7jf9",
  "tb1pxxjqjtkhh8uf5f0www5p9ph3wh5xg6s7mapteedk3mxql3hcx0fq6g7upj",
  "tb1ppkadk6yfqz0xxpt7g6vdth2fuq44v3shpk4zurk2uuwhkqh3e7us8rm4nw",
  "tb1pkf7kjqu5jp4837gxy8gvkzn20eupx44pz4mlrsq2ahlxpupsrf2qns0akq",
  "tb1ph4u94tzdzgdru35m7jcj9gpr4e76p7kjtdgkj5p6fn6vvs248mvqy9zcuh",
  "tb1pvl4jjj88t59ty4nu4vlss7yzv9u9kpfxj9setgfknyk7pw53d8ysuujdwa",
  "tb1pmgvdmayqawfnm9rmy36vhgfkj5zuvae9g5rswc49d0w3snq7d6uqm8l45r",
  "tb1pwukvum3j485dn56762ashlgtrgnlcvjsq8mt3snau3k3gg29gpls742hc0",
  "tb1pt4gaulr8weuswcyk8l3pfkkdaeglsfa9wmycr7jhxx8sar9vhresrn5wff",
  "tb1p5v0kcvtzwgzc5380trudsy64rtgae4wyd0srwgm6d8kc2nfj0c9qmzssze",
  "tb1phmae0lz5zsrjmm7mfxnv7xkn3apwwlq5h7ycahm06sd2c69ph5lqh25lgy",
  "tb1p8ha4rghhmh38vavklwdee6wq5q2nked7458qylr04cf0n2g54a6s7ypfqu",
  "tb1p50ny9qqqj32y293cr5t5u8l2k9s2n4vup8uafxpcquxna4c99nwqvkhfss",
  "tb1pqe5zydwwdp762dy0z4qc5c5ettxa5r36vhelt2xzl0qcwm9jjdlqfh9dpq",
  "tb1pxskpy7e5xpd8rj9vkq407hlfwg2svyw8rcdl7k0g6sy8l8cz55qsewvu28",
  "tb1p9wysn2qegah8sxh9s38wfese6n7paqzmvk0zs7rqf93auelat30sm770eh",
  "tb1p2h3xymmevl5merttwemevamqu0eda68x0j5szfad0fwh9lqwfguqfxp4lz",
  "tb1p8pey8wvm5j3w849xpzu5atrrtmqesq47vw4wx4ruj30as2t6nzhs3eqy44",
  "tb1ptjlhp93vpwg3a0ayzv55kszx9k885mdkrjjhzs3kc2m7znyau5tsysjf2p",
  "tb1pakufzzulmrt29ljuqf9yag70gf43fc3dt60rx8a64egs6qcadhvs8qzjgs",
  "tb1p4yctm3653nw4x2dt3yzxtcylkjw7t6xfpk7w4jv7y0ntshk6682sw8xplk",
  "tb1pz28uqly0gxq3ewpfvt2tdsa9rh8etmk394f70exzzgcrlupswdus0gf6wp",
  "tb1px72gypmc4qhkfm8j7m8r6vfng55lpnltg027geg4qhljstswe5cqyrd43j",
  "tb1pz6hpfc8cc0yeaam632nx0ytwdvwcn9w6942q9valu43qlqd5jltq6nvhys",
  "tb1ps8w70j3kpjnal82258haw28s75rm3yx9y3kl29mvkklrp5xry4eshf882y",
  "tb1p4wzn4zc70lhfw7tfs2qhxxmvt7sv7w69ckqkz9gnms993fwwe96srlyv84",
  "tb1plmvj5s0gvhc3wtmk9yq3tvh4n3tf45ewe665vlg43y6gvhdzjdrs5mt0eh",
  "tb1p938w7tk50chdqpquwtm9nztn5q7uw4gpwdy77hkd7thdgk06gqwqlk8ntz",
  "tb1p9gzzqp0grv3zlg6jmazmh7qxyumshz33zkye7mh42anzz05tmlzsv7gdfs",
  "tb1plj5pnda5tc84q0ypyrlvzy9n7tndlgtszjxhh5evtju5s7qmra0qwvnksp",
  "tb1plc7flyj9kuqpuc7q79p9j2wwx2v0686x7p05flzshlstx0f8xp5qz7juew",
  "tb1p3xzqd70z0n976x2ljwafe6lp64c090pcahagk8p4f6eld697kfsqze98c0",
  "tb1plc7flyj9kuqpuc7q79p9j2wwx2v0686x7p05flzshlstx0f8xp5qz7juew",
  "tb1p9sq2qe6eva5ksw0t2t20nq6axsp832y94st7v0urwuk0ykzlkhrsl3p07d",
  "tb1pdqxrc2yuwe8agn5w8xhy27379ljud4wyfw7zjej2ljdtc6dnstqqfekzdh",
  "tb1p94aprkggwrajagea4gj7gtq8yjpulg43w6czlryg6h4z6j386ccs5d0muu",
  "tb1p68y392p68qeay2xj9yeagze83phrtmg7pj4z7xnkmgf9emefpcvs8vw6cu",
  "tb1p7v92q9ujkxcdxxm2ay26fqyuwgwclu6zkrte9lpxw226tzuy3rzqttfy8v",
  "tb1pxelnkgtp9d7trd3pqmduz5uk4fc6u9mu0llvae2jw3uf8cap6tgq8l5lpm",
  "tb1pzc4hl3a8euep86wa5wdk5sekwn63mhe6c8l3dtun6y3strwynrtqrn5zsm",
  "tb1pnjeh2sehjnjd2a3f23gw3ml4aps4sd8hmr00mzru43a5ajrfsuusjjvw8w",
  "tb1pf8kc44qk60ltvjs3v7pkgkw5z7ya28f9nu9fvrekfs4g0p8hf0ns94sc0u",
  "tb1psvckw33qfexncvzaw9j60082q6l7ky2r6ktt8gumu46acfe3hwfsp9f6yk",
  "tb1plupkga0utt4nqgr7jkg9rfulzm3lwyueyzqwc8yr2hrepkqzs53qvsmcf4",
  "tb1p3pj85ssu4qrdwmgtzvwr5hzrrgqn3q6xf570ddy5dc327zp08ljqygnkrt",
  "tb1puvhuhktqs50z4pu660gu3tsqax4ud0cck2ppzehpwuu790stdraslhfgwg",
  "tb1pdl5we0xaxdac7t0zh8e3t5vdraa3uk4a00fkaz33xtumas3shlmql2lu2h",
  "tb1ptxmjkattn8jj6v8z7px950emk6cmdmrt2h9njzxm49qehh92z6aq2e99ht",
  "tb1paxnlskxqkmu2s63l3fs6avg04h9jlduaehl6nzz9aepwjv9la6lqhfcf95",
  "tb1pf868eddfq4wa2unj3yt3th4ak735ujnmawnjuh8q376fn9nvvxgqvgnzgh",
  "tb1p8w24puzj97ykdgdcmyqdz6xulzpnlkxkzgehjzrdw9ng2q9tx4rsdhpr3u",
  "tb1pf3330jfz3xyldv4fapnw8p60n3z0vt9a9kypv2lyzg909pkswuyq7jhsgc",
  "tb1pc63d8s2cnhg5d2wfjh70wfr086989xlplsz5xm2mt4p6sqcvgaqqupt89l",
  "tb1pgpt0m4cdllvx655e4y4xqjqaspe2xtpyz73krrjf9dt74ajtnj5qj5hmj7",
  "tb1pxk5ev507vfe6jw36q44w36hhusaz53le3jjm9dtdqqw38lu7nw4qd2ge88",
  "tb1pk8nmw53esvqjf8d3pahh9n9jrydhejnjxt0k6lqeeyamrsc29u0qllzrqx",
  "tb1p4xxxs29cd8dexnlqr273q6hcrgkzkm8kfzgnlwvs2vgeg8gkt2usl4j9ur",
  "tb1pynh6h9mfmtyeswtjuljx282zhfy3yw644at8wrnztntuz52shf4stgylyu",
  "tb1p44nwhdn2v0008p5uyjel4ws2wqja740l7v9psm6t7vhcstt0zrsqlp59ze",
  "tb1pm86e278h07c7qjdx30xz0lkr7zx0tdkgm8h5qswjmp20eh7e9cms0vupdd",
  "tb1p78xrwj342vh0a5xp3ytenv6g8u5gmx3rcn2d9vscw5zquhdn0g4q7xdv6x",
  "tb1pvkumrkmmr4jgp9u3xg6qjx52wupu5vcp0rh6zfpha2tlhslpf0equew6pq",
  "tb1pd3txtr579336m7dg46769ml5afjh8446ezy75lsle8dtus4sfr3q20erne",
  "tb1pmdxkxjtarf0rer6g62pystp9r0u8ff2a5mglgxdslq2w92d0d2ystush4y",
  "tb1p2dqmxlcwddtk05ge9ypdhgn6lj83hxjj9xta8sauthjdmt4x2aqqmpvauh",
  "tb1pxmyekl2qzn7prlnh9z4ne2ftxnz7ysv5x3uv5taywrkxnh7mgk0s7963f3",
  "tb1plf730s57h3azuvpxuj9d3lcu99lvgpn0tnt4x2y8f8slw0h54vus0p556h",
  "tb1panddx4sq5hzu0am0gjrnmefjcqh3mvqx72pqhw9hcca3sry2qjgsd9vsat",
  "tb1pxhmcyrdad4au3zpu4c0pchmwl8srvqphvnun9vxs7qwv4k8ezh8s02xmcd",
  "tb1pzy47f8u5pmufeu774aupf0slhyaemrm8kd930d9zsyfd277ptxuqvezn4f",
  "tb1pxhmcyrdad4au3zpu4c0pchmwl8srvqphvnun9vxs7qwv4k8ezh8s02xmcd",
  "tb1pmumjlzqw6madknyfhj2ws05vkadj8084hdu5mep2cqsg7y4fm80q8pjnh5",
  "tb1pzy47f8u5pmufeu774aupf0slhyaemrm8kd930d9zsyfd277ptxuqvezn4f",
  "tb1p4fchpuhxelq2z2kasuy0fl5h6ght4g4djm7uens5sngnucmmpf8q0uxs0l",
  "tb1p6ql7jnamat596tg8jmhw6g02acjcg2g2aej5evm32nvqd33gwdms09ughe",
  "tb1p482tnjnleuz2ghezh8zjzjlssukaflhzvdgq8d400nyc366mqzqsh0ffjv",
  "tb1pzy47f8u5pmufeu774aupf0slhyaemrm8kd930d9zsyfd277ptxuqvezn4f",
  "tb1p40zkep5rg7w5xr7gy7hz0g88473pz6fc25pq6muums5n33px6l7qw7g9vg",
  "tb1pxp3x78svr0vhmavs4gccr60arhpk4yc3gm649ue8xz8uf9cseh8sngcz4l",
  "tb1phm2qs74asetal93s70l9dvfpk5vu24as4ad6t4zvj2wnqq7qqjvsj8280w",
  "tb1p0at52txlra43hwqdt7lqxjgd2k5jwa8vv6c3jqd2veu0ulwyrcts87x3se",
  "tb1pr0vth32l9zk4f0dzx4fmcjntamvpgdwxmyxfgnk8s905jpz4axlsxhcamw",
  "tb1p2j50s7ycayxplf9f0wr98dlkhz6jz9mfjvlvuvwqawgp04awkp4sf0krcg",
  "tb1pjf5trj7r7ulsh7nqyrknj8pu59nrsdq265e6fm9net2fjc9tgyqs5jzyhu",
  "tb1pfa5tygpfg534wde3xysw2fnytkummh4ghk73aw6m2x4h79nl3evqjzp838",
  "tb1pettp87pssh56mzz6nfvphz497785y3jfhtutus6xf982442ct4uq88g3wa",
  "tb1pancuegjppktamqult3mselkephllj5tfmptmepzue96v8xfv3elskjf8lk",
  "tb1p7j56lkqr9w6wvtds7fwaxu9yms2jrg3hh7vrwya2sytum49w9kwqpazupq",
  "tb1pdudvepk3yh6aa23gw7a0e4ed90lw5umc3tapwptezrluxrz4hxxqsrjar9",
  "tb1phfgn30nkjvr35374ac52sve4hm53kmylgqek5wyq59pcwhzhtzuqmvulzm",
  "tb1pjtnzq2fe834py0la6pxefmp3yzcjn0t6m6048dd2jw58jjha48vqmm6hjq",
  "tb1p9xkldu7fv75dxjc429ny7neazpg4prjgyx30jqev6sj0hewmlzusemq228",
  "tb1punrhqxq0n8qkn7v9ukjastcm2yxfudfnfv4qskjpznkemgv5x5aqucln3q",
  "tb1plqueyzn90xcz2pgfdckxrdkm7xfh4e6e5ta9dch5k9pwv2sm7vqqfcfwj5",
  "tb1pys0lj3kk5jqdjqdutuapkk25u622455c09lw20cqn837vfrlaq7s3f3cty",
  "tb1p7uzdau96qphll2umk052qw56jn7qvlgs6cg9rqanm7k9r3ekryts5kjlkh",
  "tb1past4yfzm5qf7fj0nywyg3rw0d5e0z7qc8yehdqlm37qyfpugxf6sjjjnzs",
  "tb1pzlfsdgcw6wvp434kjqphtsdnv7nffcgjuvqjtlyuq3jan3mt7h7q4hzvry",
  "tb1pls6rya8pcxryekyyl38lgpzgrppl3nh8t03tlhxvj6c4f70tllkqsj4nv7",
  "tb1pw8m9ne09gg4wjzzyrtrp699yafrce92ss8t427ggpn54sdtljyjs4r60yd",
  "tb1psszwaufv7rljz5q9ull039s6ll8qyx0mmecuejvzvzqlzcnvm2eqw3ft40",
  "tb1ptu8274y82wr8e0es5ehs6zs7824sjyeqn84apvtvdpzwwuedz9uqg0zud6",
  "tb1pqszx744y0p8k0tarkzslt2et0wf8ueq829ggaqtv72c4x8m55ngq6fmx4z",
  "tb1py3sksjyneaznjqhnhhzyqnznggnu4fgp0wclltnrkzd6e3z86gmsageesl",
  "tb1par3gpjdk4s8tqhre2dph49u7z69xsvsrlefvux3pqp9ufg6uungq93z2zm",
  "tb1panddx4sq5hzu0am0gjrnmefjcqh3mvqx72pqhw9hcca3sry2qjgsd9vsat",
  "tb1pv9duzevydh8n809cq8dy89djagwd50h28e3wj4u7cmcns9a9nuus6gpztq",
  "tb1p6ql7jnamat596tg8jmhw6g02acjcg2g2aej5evm32nvqd33gwdms09ughe",
  "tb1pwravu9zgkqc9ey8zynh5k5hapgmzcla5mx47fuqlmyuhhql5x24sevpp2d",
  "tb1pnvuc9ydtce6av696jlvt2hwk9vxl2jxv3c38v5fd45w4urdclrksycs8tm",
  "tb1pleahtruydqmlarz40rl7kjxdnlx2ysfl86z004aayf9acg6pervsycn0ar",
  "tb1pp9nk67gp538dt9rrm3urmzlllvtf8vz5gdwcgurpnt4v05jdnk2sxl5ev6",
  "tb1pcpsjdjlrw0g0ya66sqlrqy4qkxu44kwkvnpynnvj9n2q953h9uasq0t7zp",
  "tb1pd3gmn8se3uv3ky8ncndcvkyf8e2zrr47pljzluwza7s4y7hdt7vqh0dx4z",
  "tb1pfa5tygpfg534wde3xysw2fnytkummh4ghk73aw6m2x4h79nl3evqjzp838",
  "tb1p7j56lkqr9w6wvtds7fwaxu9yms2jrg3hh7vrwya2sytum49w9kwqpazupq",
  "tb1pdudvepk3yh6aa23gw7a0e4ed90lw5umc3tapwptezrluxrz4hxxqsrjar9",
  "tb1pjtnzq2fe834py0la6pxefmp3yzcjn0t6m6048dd2jw58jjha48vqmm6hjq",
  "tb1pdaat3mldnlkq6kanhtt382739fr30wp22xwj4p8hz2kmfxwrqucs6mpse2",
  "tb1pqq8p7g6x5teqjqchhc58sygpqt9e720zfldwlsjjqjg8mp8usuqq4sgmc3",
  "tb1pt2nrauam4nsk0xj2ce0e98yqx605dny697d5h6nrdm3fxpgfqdxsakrf2r",
  "tb1pxs090ztqsaq2uttyvuhw3d5y9u4qmz7uyc4eyqqrccn7xkfuwdts2frj65",
  "tb1pzgmrr92zzwy5mfkvs37vp7vqgm0khqdv604ncjzplnrgalav32ss6pyr8m",
  "tb1prjvrvh62d3w4t667w9ey4ksw5s7vr6czx3529l7pqxhmazklkm4q8x9uwk",
  "tb1pek7zdp9868etua0jjwes2w9x70msrvty9stsy5wh6qqdgs3t9a2qd3s4xd",
  "tb1p5xemceknu9xj046qc3emel8ygkfw4tjt0zm0z6gphd3n6v529tuq55wx99",
  "tb1pzq7d2527t6tj2yhq76ja0skp9y6j467wvku2ng0r9ydewxq79dfqjv4rfs",
  "tb1pltmla3s2kskpu4zv0v6udu40q797rz7w5eu23kcuezg348wwqeyqjrdede",
  "tb1pgxpalsq6v4sz632a7dj9hu0jcxnmnc2j5tyrjq9j75k964gsc0esltz4fg",
  "tb1pysdujgqxt5w9xa4x5gh2jcluxflzx6ywkvaynv67eudvzmxzcyxsapmllt",
  "tb1p2rug68du9jgltx9gdku83j98e400zf34ru24z04r0yx9me5t883qyk7yqr",
];
export const inscriptionIdList = [
  "585a9e2b41fd0e053dcf5526b4e1e459b0e7dbe5774e237ca55adf46155b6e04i0",
  "21c97f3455e9c7af2d87cd51fdb86e168df3826f78319da83fa9e23347ad4305i0",
  "73ae029cc185feab3bf8806fbe0248bf3dd352249893a80a01b74cdeb9278305i0",
  "5e3ca296ec12ad836eba341a65879c719a79cab5abd1f7f045b10d7c7b902907i0",
  "70b4b0ca3ca9b8890a293d042fd5a00873d605d2608364ad1bbadb59770a3308i0",
  "67489b33ed2d1ed9b36d53504f179b62dd2306fc0c5bda6837a5e8a4f98d0f09i0",
  "2a04329efb0423f85bdff759feb8e088df7c716bf7030c2ec77f659b6644020ai0",
  "ae52c891ba58a68aebf70393d5fc99b2e3473aa1fac48bef866f4526b2e29f0ai0",
  "fa848c884413df2aabc3b2ed5d72a4cc979b2f64baf3543bd525d88cdde6ce17i0",
  "2e4ee63f29ac15c494b3161b975c8ab4b47b900591c5fa377521873968612f1ci0",
  "dc6656d3b6a257ea4ca64f80086ac7ca5de36cd00ab38a8ec369426b0625691ei0",
  "c97a8c8f8fea9c69408a16146e525a6d2e0ea6c05605e17dbd9d946521eb1c28i0",
  "522381afb0af37fe212ae1f1503716fb2146969a509d33af7f8d7ea4cabb9128i0",
  "1e740f45913afc787cc0ed81fa6ae16c3c22ca5ed3b2f3a415eaef3c48128429i0",
  "83e14d53a696ed1fdab89f37347ed8d999ef0413de152c4bc50af1eb1109bf29i0",
  "659721838d2a96e2d2da274180f96eb000b535fece6dc7236b69ff9bca3d9b31i0",
  "846bd14b34b0a4e6a9e96825ddf5da0bc790735bf7db14988c4aa0abacf60534i0",
  "98b27e57beea4687f2cffe8f817ea7cae59be05392f8239e70ba41ef48e25938i0",
  "d788e51150b8804a636ce897a60ce4f53c88c38a8e9df12ff8edaf233905b43ai0",
  "7003ff580b4a155620080706a1906ebdb6b09d51c2fbc565127e044c9b4d103bi0",
  "88739f406eab5825c655f8d4c3845e69fef8ec124dca9f49546e1831dcc5c83ei0",
  "c09b8e7d7783d327e9e6650914ece98a81c9b6d87c9c5a1a9901fb467fe49e42i0",
  "c526dadf2149fde2a24cf230890856c3d38df90f58c6145ebfcc2195f771a845i0",
  "0214a7408c081ff6210f35f9147130750ca2c3d5001360d682a6a474e3484249i0",
  "99d39fb6360fc5a19535b4d7791ef7917403589ad14ed15ed582e2fad2a79349i0",
  "cf3c6437e5fd6de53095e9b69b01a7b2d8e03d42748e0e94e8ca7aa9454f394ai0",
  "9ed21f9318319c3c28feb749b3f524d445e01b39d5d7bc7872d5c7f90a488252i0",
  "92f00b6c98c5049ad7d2b1d2ad6e2be5c7ef3ebe9cabd6713dd7e96a651abb52i0",
  "f5f81dc749157bf90831ec139203d4053330b158a8b2eacf6ceffb7ac7683f5bi0",
  "578a4dc7b7293f0b25527c3de34cd62bf69418c6759b7b29718ce93cc5bc1f5ci0",
  "0da97ee970c66028ff3746105467658da1a9e63726f6213ef288821446793860i0",
  "4fff62b013c5e11ccf9e7a8ad8b051e3e462a131413868b2e58323c9addb3262i0",
  "8b298a1797dde52715f661c0fe186b14854d8dface7432da1b7e06082f89a062i0",
  "a9953beb2891cd4ff76de87547d8bef9d0bd63e6dc50c5170a535343330dd162i0",
  "58f707edf855a768e06554c504574f25fc704510c605a819850944427d94a163i0",
  "0869fc1c10af11e5463a1ac635b4d6337cb3954980388c685de9743af4786767i0",
  "f86ead8c57ce095391284ee32263d8436fd37738d973a5b42dd0869c3bd92868i0",
  "deeb7406973bfd6289d9bf188ede59c17d357ac66b951b315d3366449127526ai0",
  "7ea4b1e834a78bf1eb3af3820dcb8d5f0a492b4367e64c1bfb62defc24471270i0",
  "eb5512f120c16a640cd037e689e7f5af52eb07a94cccb57bccce657c825cbb74i0",
  "fdfe38277bcaa0a8d3e74ab872bb2a5e94b7d4dedea18575fae85598e550f078i0",
  "922a4420792f7f67fc801f1677fc7a737e70f30cba5e5b88fb619c3c6e30dd7ei0",
  "e1a4af4998fc43b60189ef6e5f571b8ae79808fe851d2aab71e95e7b76489a7fi0",
  "4dd37cc3b903e1b9aab30912b7a58cc378fc608a90598316e76d26d186119682i0",
  "8b8da2cb1facae8e45b5ff7ace395c605d6de2268c67f2b37624900b5e525a85i0",
  "78af4892b3717087dd140e9e6736d272125e6fa2615501f8ff687aa78a65bc87i0",
  "8316b3c0dfbc550d1312fb2b24d3be01052952fd45267516742a1efea733ba8ai0",
  "660f98caa74e9b43b302f90f70f57e6c504da361d2d98c4db71e419537f6338di0",
  "9337bb14158ced6b7c0cb1c12b72a96839b0ffa8f45d06c9be322b753a044c8di0",
  "580a843cba9a48aa753ee6dbd488f5d66c7cb5b2eaa78963a6988fccf4786190i0",
  "801e19b6a639a1f3cc3f33dc654b85c16a99a2637dc85cba44eb738b78539f91i0",
  "1bec1b9fc266d0e253520cd7ebaf264d7dd3957a3d74f969fbcf55c0b96fc193i0",
  "2a7e5ce786f8571b03bae244f7539f9a3bd295d575a87b544fc2704e8489a794i0",
  "15d60551afe6b25d346fd419cadfd9a04d2b26de301801ee909824664ef2a696i0",
  "c4ce394343ee74d0a94471c9ac4ebed6168706cdcb71bddcfbc256ba2a1d0797i0",
  "732e0a2fa29a54a2b06f153bc3cfe3671b33c9b02384506861a2219389cb4a9ai0",
  "8b23b3fea73d0ca7b2510d8ae21fa4d38cd4eb67eb1a7eae408c3d4c1676589ai0",
  "7fdc95552e3e93f1b7a173c8071bf8d2dea67d709208d1e12e22327bcbf0969bi0",
  "b3b784a143c9de5d3dff86ced30041c6112a0ef83eea8a7cff0256c9fa8be89bi0",
  "a8ebb51b2c0e51821ad8936efd80a8f3dc81df12c2cff678e71c85abada299a1i0",
  "21bd58d2b49ea210c4a9923fef0588f2ef31be6be060b214ff4a12f10c7a07a5i0",
  "74273c1c43a8a44e2073e26f908fe09681099e970be9632552dd2b3b0cd9ceaci0",
  "69c66503a38b968e262befd439a543117e6e8227ac89ab524754e762f2562cb1i0",
  "0c3de1f60271c8458c115bffc06cbe532c022963748f9b438bcfda5cb99775b1i0",
  "78c7bbd0d8a1da416d42c0fb3c8a9d13e782484e1d6ec176a55f92ac70b0e5b1i0",
  "a5103835553991164dee59acc036de2743e6aad87ba0793a1f65a626febff8b2i0",
  "0d8415acc37ee115607c5145116f83592508c476b2296ec9b89f7366023ab5b3i0",
  "e63b9981e426f342ae9cbf3a5a868fe8411391ead87f5fbca113f58faa96a1b4i0",
  "7b00f53a9b786ccee3e820d350980c82bb292f18f45257fdc17481b5e608d2b9i0",
  "6f3540a96ef7bde51ddb1c336ca7d1a51f4b1f19f18333e64f8e6992ed801abci0",
  "5ad24addd966c1222d89c8e89219537706ed183b613a87a090c5f8d9e7979fbfi0",
  "1e6b3cad4bcb863fe4233ae78d26e1dcf448a756c7a38e14a98517da922721c0i0",
  "c15f3b3bf38dbbab9464755a2f2379cd67ca046e7608447ffede0f851edcd5c2i0",
  "93905eee3e786ac2f3bb2a7015825f17c1c98651653d838e38e92027db8968c4i0",
  "57a3bf883dfd15130048469c9f072e8a2bb6cd263b16382097a5ef7976f498c4i0",
  "32aa9716e6883cd163a3281dab0b3b5d442eebc9ba18de04a95488e522e5c2c4i0",
  "84d267bd5f90bb9fd34a0951f77288ce55d9a2c8b02962b0e2c7d6a132aa92c9i0",
  "fb47a52bb63e95ec754c050edc126bbcf2292f14ffc71c87a01bbf4180a120cai0",
  "f9811290958462f48fe980d70f7bed4c5a3b940034a484710f94d6d2c07023cci0",
  "2a08b8f2bedef21b8c183b23439ce72534801c65ba010675f1701918b34403d1i0",
  "9b5b7cab3f52229a05e21cf67e9c56ebbcd9f17828d989c1ecc2b04f2ef68cd4i0",
  "fbaa539d4d40af29b2318b0c375fcec585ee31b8c362188a9454165db41c06d5i0",
  "1e4dba4b8e7e0afcfad80fd1af3fc7b92159d181e695c6fb5c88fac243f1f5d9i0",
  "6da27d7063ddb277ea2d175bf0e68ad896dc8c4c565c3dca1e5bf90f5dc32ddbi0",
  "9297aed2999e4f1b16faee45a094c5aad12e69f4c22b4d89d98d13088edfbadei0",
  "9e13e6cbc27608220938c62aac8476b2b7dd7407c2a70ff83dad56b081cacfdei0",
  "408c47788b94600c28b0eb949369b0dd3e817720b5f20af27e705263fa2984e1i0",
  "56087a5c228a1e4391d88107b51b8e03caff4678711d4bace7eef6eeed40ebe3i0",
  "8ba04622db6319557b23fbf2c81f6bc772b336147bb4d3b2adf2569d4a0919e5i0",
  "9a315c4764a9d38cb018ad785fb763bf56ffa7a956a8d8a7be3f63fb16df04e6i0",
  "1e0ad918337ce0c8c6b27b74285b9c4134dd78c80e837bd3894584b412afd8e6i0",
  "308f1263cfda3091ff73a2a81bbcc21e29d62a4caebab5f17409adc6231619ebi0",
  "1b075c35691cba57c7e40ae3ca4fee3f5b3484720236b3ff623de85264e150ebi0",
  "0ca26abf7ecd2030cb48e7e33acfc13b7b484b0d787c9f1a167fef22cfa390efi0",
  "48f419fcf65f8dbec1023a2e2e045b795c7f3ddec23c9752f17f5c00987e2cf1i0",
  "e2b34e07c61182b17a4ddbfad314054e902665636498cf9c64f48e0746479bf3i0",
  "4315ff342258d1daa2877c648b93162cf57fd98f319872a4a3e909e2f1d1c9f5i0",
  "a9197eb4087d5e8f12aa1b2a4bcfc6f3ebe605538c53b7fbc2d924ea5c2887f7i0",
  "2686b68d52accd6a3e4d3e6ecef4ed01ff641a53a4ecda0bb2ccfc5ef39713fbi0",
  "55dda148c24a8000d3787fff95b2404734dda3ceb06d106f8d59ab9bbc17c0fbi0"
];


export const SATURN_KEY = process.env.SATURN_KEY;
export const UNISAT_KEY = process.env.UNISAT_KEY;

export const SATURN_URL = "https://indexer-dev.saturnbtc.io";

export const POOL_ID =
  "e8b4908464fc5bef0bfe70146666a0dcda4a9e59b84dd60e1f14d5aca53bdae7";

export const RUNE_TOKEN_NAME_1 = "THISISFIRSTRUNE";
export const RUNE_TOKEN_NAME_2 = "sat";
export const SATURN_CONNECT_URL = "https://api-dev.saturnbtc.io";

export enum WalletTypes {
  UNISAT = 0,
  XVERSE = 1,
}
