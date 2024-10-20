const ethers = require("ethers");
const solJson = require("./abis/Survivor.json");
const { JsonRpcSigner } = require("ethers");
const { Signature } = require("ethers");

const provider = new ethers.JsonRpcProvider();

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const gameId =
  "0xfbd3d263894b072a0bb40c17955cc8ff54af5e15f2b4ac0705fd068b93161c24";

const ten_minutes = 10 * 60;

const message_to_sign = ethers.id("hello");
console.log("to sign:", message_to_sign);

async function createSurvivorContract() {
  const fact = new ethers.ContractFactory(
    solJson.abi,
    solJson.bytecode,
    await provider.getSigner(0)
  );
  const contract = await fact.deploy();
  console.log("Address: ", contract.getAddress());
  console.log((await fact.deploy()).deploymentTransaction());
}

async function getSurvivorContractInstance() {
  return new ethers.Contract(
    contractAddress,
    solJson.abi,
    await provider.getSigner(0)
  );
}

async function createNewGame(name) {
  const addresses = (await provider.listAccounts())
    .map((value) => value.address)
    .filter((value, index) => index != 0);

  // console.log(addresses);

  const contract = await getSurvivorContractInstance();
  const transaction = await contract.createGame(name, addresses);
  const receipt = await transaction.wait();
  console.log("Transaction: ", transaction);
  console.log("Receipt: ", receipt);
  console.log("Logs: ", receipt.logs);
}

async function startRound() {
  console.log("Calling startRound...");
  const now = Math.floor(Date.now() / 1000);
  const contract = await getSurvivorContractInstance();
  const transaction = await contract.startRound(gameId, now + ten_minutes);
  const receipt = await transaction.wait();
  console.log("Transaction: ", transaction);
  console.log("Receipt: ", receipt);
  console.log("Logs: ", receipt.logs);
}

async function _transactionBoiler(method, ...args) {
  const transaction = await method(...args);
  const receipt = await transaction.wait();
  console.log("Transaction: ", transaction);
  console.log("Receipt: ", receipt);
  console.log("Logs: ", receipt.logs);
  return transaction;
}

async function voteInRound(signerNum) {
  const contract = (await getSurvivorContractInstance()).connect(
    await provider.getSigner(signerNum)
  );
  _transactionBoiler(contract.voteInRound, gameId, gameId); // technically third param should be the encryption commitment, but that part should be easy
}

async function _constructSignature(signerAddress, addressVotedFor) {
  // console.log(ethers.getBytes(addressVotedFor));
  // const mess = ethers.hashMessage(message_to_sign);
  // console.log("Message to sign: ", message_to_sign);
  // const uint8form = ethers.toUtf8Bytes(message_to_sign);
  // console.log("Uint8 array: ", uint8form);
  // const hexed = ethers.hexlify(uint8form);
  // console.log("hexed: ", hexed);
  return await provider.send("eth_sign", [signerAddress, message_to_sign]);
}

// async function check

// _constructSignature(
//   "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
//   "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
// ).then((val) => console.log("_constructSignature:", val));

async function removePlayerFromGame(addresses, votes) {
  let sigs = [
    ethers.getBytes(
      "0x8a26fcb5bc12e3d095a01129e938b7d094d3c7785951b6585936729657264763160463f889c39d34f68d9ffafbbc14e04574693516fdece09e4a3fbd5c024f9f1c"
    ),
  ];

  // for (let i = 0; i < addresses.length; i++) {
  //   sigs.push(await _constructSignature(addresses[i], votes[i]));
  // }
  console.log("sigs:", sigs);
  console.log("addresses:", addresses);
  console.log("votes: ", votes);

  const contract = await getSurvivorContractInstance();
  _transactionBoiler(contract.removePlayer, gameId, sigs, addresses, votes);
}

// removePlayerFromGame(
//   ["0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"],
//   ["0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"]
// );

async function _jsVerify() {
  // const messageRaw = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";
  const privKey =
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
  // const message = ethers.AbiCoder.defaultAbiCoder().encode(
  //   ["address"],
  //   [messageRaw]
  // );
  // console.log("Message:", message);
  const message = ethers.getBytes(message_to_sign);
  const wallet = new ethers.Wallet(privKey);
  const sig = await wallet.signMessage(message);
  const fullsig = Signature.from(sig);
  console.log("Full sig: ", fullsig);
  console.log("_jsVerify sig:", sig);
  console.log("v: ", fullsig.v);

  console.log("Verify:", ethers.verifyMessage(message, sig));
  console.log(
    "Verify2:",
    ethers.verifyMessage(
      message,
      "0xe44c58472cc0897f1267a9bda90867625dd443b40dc7f0ab0fec39b84c9d8057072d3bcde531da298162ae12e75f724b063662929c90877e1f308dd84fe9167a00"
    )
  );
}

_jsVerify();

function addUnderscores() {
  // Remove any existing spaces from the input string
  const cleanString =
    "1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8";

  // Use a regular expression to add underscores
  const result = cleanString.replace(/(.{2})(?=.)/g, "$1_");

  return result;
}

// console.log(addUnderscores());
