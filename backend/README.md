"# testnet4-psbt"

## Put below info to .env file

# EndPoint Description

## Ordinal -> Rune Swap

### First Step

POST URL http://localhost:9000/api/swap/pre-rune-inscribe-generate-psbt

#### Params

userAddress : User's Address
userPubkey : User's Pubkey
inscriptionId : Inscription ID

#### Result

hexPsbt : PSBT to be signed via User Wallet
signIndexes : Sign Indexes
runeUtxos : Available Smart Contract's Rune UTXO
remainAmount : After send Utxo's Remain Rune Amount

### Second Step

POST URL http://localhost:9000/api/swap/push-rune-inscribe-psbt-arch

#### Params

signedPSBT : Signed PSBT via User's Wallet
runeUtxos : Smart Contract's Rune Utxo from First API Output
remainAmount : After send Utxo's Remain Rune Amount from First API Output

#### Result

txid : Txid Boradcasted on Mempool

## Rune -> Ordinal Swap

### First Step

POST URL http://localhost:9000/api/swap/pre-inscribe-rune-generate-psbt

#### Params

userAddress : User's Address
userPubkey : User's Pubkey

#### Result

psbt : PSBT to be signed via User Wallet
signIndexes : Sign Indexes
inscriptionUTXO : Available Smart Contract's Inscription UTXO

### Second Step

POST URL http://localhost:9000/api/swap/push-inscribe-rune-psbt-arch

#### Params

signedPSBT : Signed PSBT via User's Wallet
inscriptionUtxo : Available Smart Contract's Inscription UTXO from First API Output

#### Result

txid : Txid Boradcasted on Mempool
