const web3 = require("@solana/web3.js");
const borsh = require("@project-serum/borsh");
const fs = require("fs");
const dotenv = require("dotenv");
const { error } = require("console");
dotenv.config();

function intializeSignerKeyPair() {
  if (!process.env.PRIVATE_KEY) {
    console.log("Using private key from .env");
    const signer = web3.Keypair.generate();
    fs.writeFileSync(
      "./.env",
      "PRIVATE_KEY=[" + signer.secretKey.toString() + "]"
    );
    return signer;
  }

  const secret = JSON.parse(process.env.PRIVATE_KEY || "");
  const secretKey = Uint8Array.from(secret);
  const KeypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey);
  return KeypairFromSecretKey;
}

function airdropSolIfNeeded(signer, connection) {
  return connection.getBalance(signer.publicKey).then((balance) => {
    console.log("Current balance is", balance / web3.LAMPORTS_PER_SOL);
    if (balance < web3.LAMPORTS_PER_SOL) {
      console.log("Airdropping 1 SOL");
      return connection.requestAirdrop(signer.publicKey, web3.LAMPORTS_PER_SOL);
    }
    return Promise.resolve();
  });
}

const movieInstructionLayout = borsh.struct([
  borsh.u8("variant"),
  borsh.str("title"),
  borsh.u8("rating"),
  borsh.str("description"),
]);

function sendTestMovieReview(signer, programId, connection) {
  let buffer = Buffer.alloc(10000);
  const movieTitle = "Knight" + Math.random() * 10;
  movieInstructionLayout.encode(
    {
      variant: 0,
      title: movieTitle,
      rating: 5,
      description: "awesome movie",
    },
    buffer
  );

  buffer = buffer.slice(0, movieInstructionLayout.getSpan(buffer));

  return web3.PublicKey.findProgramAddress(
    [signer.publicKey.toBuffer(), Buffer.from(movieTitle)],
    programId
  ).then(([pda]) => {
    console.log("PDA is ", pda.toBase58());

    const transaction = new web3.Transaction();

    const instruction = new web3.TransactionInstruction({
      programId: programId,
      data: buffer,
      keys: [
        {
          pubkey: signer.publicKey,
          isSigner: true,
          isWritable: false,
        },
        {
          pubkey: pda,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: web3.SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
    });

    transaction.add(instruction);
    return web3.sendAndConfirmTransaction(connection, transaction, [signer]);
  });
}

function main() {
  const signer = intializeSignerKeyPair();

  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  return airdropSolIfNeeded(signer, connection).then(async () => {
    const movieProgramId = new web3.PublicKey(
      "68hTdZxxUS9b4Fc18c1Hb2MbheRup74HiLoF7JkActcU"
    );
    let hash = await sendTestMovieReview(signer, movieProgramId, connection);
    console.log(hash);
  });
}

main()
  .then(() => {
    console.log("finished successfuly");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
