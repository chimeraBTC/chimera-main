use std::str::FromStr;

use arch_program::{
    account::AccountInfo, input_to_sign::InputToSign, msg, program::next_account_info,
    program::set_transaction_to_sign, program_error::ProgramError, pubkey::Pubkey,
    transaction_to_sign::TransactionToSign,
};
use bitcoin::{
    self, absolute::LockTime, transaction::Version, OutPoint, ScriptBuf, Sequence, Transaction,
    TxIn, Txid, Witness,
};
use borsh::{BorshDeserialize, BorshSerialize};

pub(crate) fn swap_inscription_rune(
    accounts: &[AccountInfo],
    program_id: &Pubkey,
    instruction_data: &[u8],
) -> Result<(), ProgramError> {
    if accounts.len() != 1 {
        return Err(ProgramError::Custom(501));
    }

    let account_iter = &mut accounts.iter();
    let account = next_account_info(account_iter)?;

    let params: SwapInscriptionRuneParams =
        borsh::from_slice(&instruction_data[1..]).map_err(|_e| ProgramError::InvalidArgument)?;
    let user_swap_tx: Transaction =
        bitcoin::consensus::deserialize(&params.user_swap_psbt).unwrap();

    msg!("User Sign Tx {:?}", user_swap_tx);

    let mut tx = Transaction {
        version: Version::TWO,
        lock_time: LockTime::ZERO,
        input: vec![],
        output: vec![],
    };

    tx.input.push(TxIn {
        previous_output: OutPoint {
            txid: Txid::from_str(&params.inscription_txid).unwrap(),
            vout: params.inscription_vout as u32,
        },
        script_sig: ScriptBuf::new(),
        sequence: Sequence::MAX,
        witness: Witness::new(),
    });

    for (index, input) in user_swap_tx.input.iter().enumerate() {
        tx.input.push(input.clone());
    }

    for (index, output) in user_swap_tx.output.iter().enumerate() {
        tx.output.push(output.clone());
    }

    msg!("User Tx {:?}", tx);

    let tx_to_sign = TransactionToSign {
        tx_bytes: &bitcoin::consensus::serialize(&tx),
        inputs_to_sign: &[InputToSign {
            index: 0,
            signer: account.key.clone(),
        }],
    };

    msg!("tx_to_sign{:?}", tx_to_sign);

    set_transaction_to_sign(accounts, tx_to_sign)
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct SwapInscriptionRuneParams {
    pub inscription_txid: String,
    pub inscription_vout: u8,
    pub user_swap_psbt: Vec<u8>,
}
