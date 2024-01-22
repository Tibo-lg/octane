# Creating a relayer's token mint

In order to create a relayer's Solana token mint (and an associated account), follow these steps:

```
$ solana airdrop 1 --url devnet
$ spl-token create-token --url devnet --decimals 6
```

After the last command, you should see:

```
Creating token <base58 encoded TRANSFER_MINT public key>
```

Then, do the following:

```
$ spl-token create-account <your TRANSFER_MINT> --url devnet
$ spl-token mint <your TRANSFER_MINT> 100000 --url devnet
```

(`100000` is the amount of tokens to mint.)

After the last command, you should see:

```
Minting 100000 tokens
  Token: <base58 encoded TRANSFER_MINT public key>
  Recipient: <base58 encoded TRANSFER_ACCOUNT public key>
```

Copy `TRANSFER_MINT` and `TRANSFER_ACCOUNT` to update the corresponding fields `mint` and `account` in relayer's `config.json`.

Then, copy `TRANSFER_MINT` to update the `SOLANA_TEST_TOKEN_MINT` constant variable in `medici/loan-capital/src/solana.rs`.

Do not forget to commit the changes.

In order to fund both the borrower and the lender, do the following:

```
$ spl-token transfer <your TRANSFER_MINT> 5000 <the receiver's address> \
    --url devnet --fund-recipient --allow-unfunded-recipient
```

You also need to fund `GnVyNLmYG9YPpKbq5hErkYBa1Y5GRfsYzuYfraVJnNfw` with some reasonable amount of tokens to make the relayer tests in `lava-blockchain/src/alt/solana.rs` work.

Congratulations, you are all set!

TODO: if possible, we should eventually have a shared mint key.
