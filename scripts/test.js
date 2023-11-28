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


// Verify PADO signature on Sepolia Testnet
const domain = {
    name: "PermissionedEIP712Proxy",
    version: "0.1",
    chainId: 11155111,
    verifyingContract: "0x140Bd8EaAa07d49FD98C73aad908e69a75867336"
};
const types = {
    "Attest": [
        {
          "name": "schema",
          "type": "bytes32"
        },
        {
          "name": "recipient",
          "type": "address"
        },
        {
          "name": "expirationTime",
          "type": "uint64"
        },
        {
          "name": "revocable",
          "type": "bool"
        },
        {
          "name": "refUID",
          "type": "bytes32"
        },
        {
          "name": "data",
          "type": "bytes"
        },
        {
          "name": "deadline",
          "type": "uint64"
        }
      ]
};
const values = {
    schema: "0x5f868b117fd34565f3626396ba91ef0c9a607a0e406972655c5137c6d4291af9",
    recipient: "0x7ab44de0156925fe0c24482a2cde48c465e47573",
    expirationTime: 0,
    revocable: true,
    refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
    data: "0x00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c08798af10ea3670e259a6016c5deef53ef0494a10990a8e1c9670dd84aabbed9600000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000018c15e01f0b0df87612c6ed92bc9e50e837cd8282e0ef241e37bf3a9a62aefebd7ecd06f87d00000000000000000000000000000000000000000000000000000000000000084964656e746974790000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001780000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000114163636f756e74204f776e65727368697000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000085665726966696564000000000000000000000000000000000000000000000000",
    deadline: 0
};
const signature = "0xec4106e89df13f12e4ad8a61114674b00895866a50dceafae48fb3806079b1430cb44b535d0af41e4be4fb1fda5036fcad95266bf789b03d28b4e127d1832b311b";
const recoveredAddress = ethers.utils.verifyTypedData(
    domain,
    types,
    values,
    signature
);
console.log("recoveredAddress=", recoveredAddress);
const PADOSingerAddress = "0xe02bD7a6c8aA401189AEBb5Bad755c2610940A73";
if (recoveredAddress === PADOSingerAddress) {
    console.log("verify true");
}

process.exit();
