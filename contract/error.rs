use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Debug,Error)]
pub enum ReviewError {
    // error 0
    #[error("Account is uninitialsied yet")]
    uninitialsiedAccount,

    //error 1
    #[error("PDA derived is not equal to passed in")]
    InvalidPDA,

    //error 2
    #[error("input data exceeds max length")]
    InvalidDataLength,

    //error 3
    #[error("Rating greater than 5 or less than 1")]
    InvalidRating
}

impl From <ReviewError> for ProgramError{
    fn from (e:ReviewError) -> Self{
        ProgramError::Custom(e as u32)
    }
}