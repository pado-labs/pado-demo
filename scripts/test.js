import { GraphQLClient} from 'graphql-request'
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';

// eas graphql url in sepolia testnet
const sepoliaGqlUrl = "https://sepolia.easscan.org/graphql";

// The schemas created by pado on eas sepolia
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
const PADOAttester = "0x140Bd8EaAa07d49FD98C73aad908e69a75867336"; // PADO address as a Attester

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
const userAddr = "0x7ab44DE0156925fe0c24482a2cDe48C465e47573"; 
const client = new GraphQLClient(sepoliaGqlUrl)
const result = await client.request(QUERY, { where: { 
    "schemaId": { "equals":PADOSchemas.tokenHoldingsProof.id}, // equal token holdings proof id
    "recipient":{"equals":userAddr}, // equal user address
    "attester": {"equals": PADOAttester}
} });
console.log("result=", result.attestations);


let chooseid = "";
await Promise.all(result.attestations.map(async (item) => {
    const schemaEncoder = new SchemaEncoder(PADOSchemas.tokenHoldingsProof.schemaStr);
    const decodeData = schemaEncoder.decodeData(item.data);
    const schemadata = {};
    decodeData.forEach((i) => {
        schemadata[i.name] = i.value.value;
    });
    console.log("schemadata=", schemadata);
    if (schemadata.asset === "USDT" && schemadata.balanceGreaterThanBaseAmount) {
        chooseid = item.id;
        return;
    }
}));
console.log("chooseid=", chooseid);


// pass attestation id to chain contract
/*const PADODemoAddr = '0x1cEb2a6F52F0bD8dD14B67bBcAdb65E0AdC199A5';
const abi = [
      'function testVerifyAttestation(bytes32 uid) public view returns (bool)',
      'function testBusiness(bytes32 uid) public returns (bool)'
];
let provider = ethers.getDefaultProvider('sepolia');
const contract = new ethers.Contract(PADODemoAddr, abi, provider);
const res = await contract.testVerifyAttestation(chooseid, {from: userAddr});
console.log('res=', res);*/

process.exit();
