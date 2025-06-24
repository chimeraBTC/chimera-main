//! # CHIMERA Hybrid Swap Program
//! 
//! This program implements a trustless atomic swap between Bitcoin inscriptions and Runes on the Arch Network.
//! It provides two main functionalities:
//! 1. Swap an inscription for Runes
//! 2. Swap Runes for an inscription
//!
//! The program uses Bitcoin's PSBT (Partially Signed Bitcoin Transaction) format for secure transaction handling.

use arch_program:{
    account::AccountInfo, entrypoint, msg, program_error::ProgramError, pubkey::Pubkey,
};
use swap_inscription_rune::{swap_inscription_rune};
use swap_rune_inscription::{swap_rune_inscription};

// Import the swap modules
pub mod swap_inscription_rune;
pub mod swap_rune_inscription;

/// The entrypoint of the program, registered with the Arch Network runtime.
/// This function is called by the Arch Network runtime to process instructions.
/// 
/// # Arguments
/// * `program_id` - The public key of the program
/// * `accounts` - The accounts required by the instruction
/// * `instruction_data` - The serialized instruction data
/// 
/// # Returns
/// * `Result<(), ProgramError>` - Returns Ok(()) on success, or a ProgramError on failure.
#[cfg(not(feature = "no-entrypoint"))]
entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> Result<(), ProgramError> {
    // The first byte of instruction_data determines which instruction to execute
    match instruction_data[0] {
        // Instruction 0: Swap Inscription for Runes
        0 => {
            msg!("Processing Swap Inscription for Runes");
            swap_inscription_rune(accounts, program_id, instruction_data)
        }
        // Instruction 1: Swap Runes for Inscription
        1 => {
            msg!("Processing Swap Runes for Inscription");
            swap_rune_inscription(accounts, program_id, instruction_data)
        }
        // Invalid instruction code
        _ => {
            msg!("Invalid instruction code provided");
            Err(ProgramError::InvalidArgument)
        }
    }
}
