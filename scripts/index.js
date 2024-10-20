const ethers = require("ethers");
const solJson = require("./abis/Survivor.json");
const { JsonRpcSigner } = require("ethers");

const provider = new ethers.JsonRpcProvider();

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const gameId =
  "0xfbd3d263894b072a0bb40c17955cc8ff54af5e15f2b4ac0705fd068b93161c24";

const ten_minutes = 10 * 60;

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

async function _constructSignature(addressVotedFor, signerPromise) {
  const signer = await signerPromise;
  console.log(ethers.getBytes(addressVotedFor));
  return await provider.send("eth_sign", [signer.address, addressVotedFor]);
}

// async function check

_constructSignature(
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
  provider.getSigner(2)
).then((val) => console.log(val));

async function removePlayer(addresses, votes) {
  let sigs = [];

  for (let i = 0; i < addresses.length; i++) {
    sigs.push(await _constructSignature(addresses[i], votes[i]));
  }
}
