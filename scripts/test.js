import { GraphQLClient} from 'graphql-request'
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';

// eas graphql url in sepolia testnet
const sepoliaGqlUrl = "https://sepolia.easscan.org/graphql";

// The schemas created by pado on eas
const PADOSchemas = {
    assetsProof: {
        id: "0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9",
        schemaStr: "string source,bytes32 sourceUseridHash,bytes32 authUseridHash,address receipt,uint64 getDataTime,uint64 baseValue,bool balanceGreaterThanBaseValue"
    },
    tokenHoldingsProof: {
        id: "0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084",
        schemaStr: "string source,bytes32 sourceUseridHash,bytes32 authUseridHash,address recipient,uint64 getDataTime,string asset,string baseAmount,bool balanceGreaterThanBaseAmount"
    }
}
const PADOAttester = "0xe02bD7a6c8aA401189AEBb5Bad755c2610940A73"; // PADO address as a Attester


// Use graphql to query proofs of satisfying conditions
const QUERY = `
query Attestations($where: AttestationWhereInput) {
    attestations(
      where: $where
      ) {
      attester
      id
      revocable
      recipient
      schemaId
      data
    }
  }  
`;
const userAddr = "0x982B10972634E50f67e83b4a0c4214Cc9359480e"; 
const client = new GraphQLClient(sepoliaGqlUrl)
const result = await client.request(QUERY, { where: { 
    "schemaId": { "equals":PADOSchemas.tokenHoldingsProof.id}, // equal token holdings proof id
    "AND":[{"recipient":{"equals":userAddr}}] // equal user address
} });
console.log("result=", result.attestations);


// filter proofs
async function checkPADOAttester(attester) {
    const contractAddress = attester;
    const abi = [
      'function owner() public view returns (address)',
    ];
    let provider = ethers.getDefaultProvider('sepolia');
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const owner = await contract.owner();
    console.log('owner=', owner);
    if (owner === PADOAttester) {
        return true;
    }
    return false;
}

let chooseid = "";
await Promise.all(result.attestations.map(async (item) => {
    const checkPADO = await checkPADOAttester(item.attester)
    console.log('checkPADO=', checkPADO);
    if (!checkPADO) { // must be signed by PADO
        return;
    }
    const schemaEncoder = new SchemaEncoder(PADOSchemas.tokenHoldingsProof.schemaStr);
    const decodeData = schemaEncoder.decodeData(item.data);
    const schemadata = {};
    decodeData.forEach((i) => {
        schemadata[i.name] = i.value.value;
    });
    console.log("schemadata=", schemadata);
    if (schemadata.asset === "ETH" && schemadata.balanceGreaterThanBaseAmount) {
        chooseid = item.id;
        return;
    }
}));
console.log("chooseid=", chooseid);


// pass attestation id to chain contract
const PADODemoAddr = '0xC25f43419746b810d97ce0Ab1577a7B65b6D187A';
const abi = [
      'function testVerifyAttestation(bytes32 uid) public view returns (bool)',
      'function testBusiness(bytes32 uid) public returns (bool)'
];
let provider = ethers.getDefaultProvider('sepolia');
const contract = new ethers.Contract(PADODemoAddr, abi, provider);
const res = await contract.testVerifyAttestation(chooseid, {from: userAddr});
console.log('res=', res);
