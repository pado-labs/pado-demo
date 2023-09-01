// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IEAS } from "./IEAS.sol";
import { Attestation } from "./Common.sol";

contract PADODemo is Ownable {
    // The global EAS contract.
    IEAS private _eas;
    address private _PADOAddress;
    bytes32 private _PADOSchema;

    bool public result;

    constructor (IEAS eas, address padoAddress, bytes32 padoSchema) {
        _eas = eas;
        _PADOAddress = padoAddress;
        _PADOSchema = padoSchema;
    }

    function testBusiness(bytes32 uid) public returns (bool) {
        if (testVerifyAttestation(uid)) {
            result = true;
        } else {
            result = false;
        }
    }

    function testVerifyAttestation(bytes32 uid) public view returns (bool) {
        Attestation memory ats = _eas.getAttestation(uid);
        if ((Ownable)(ats.attester).owner() != _PADOAddress) {
            return false;
        }
        if (ats.recipient != msg.sender) {
            return false;
        }
        if (ats.schema != _PADOSchema) {
            return false;
        }

        (string memory source,bytes32 sourceUseridHash,bytes32 authUseridHash,address recipient,uint64 getDataTime,string memory asset,string memory baseAmount,bool balanceGreaterThanBaseAmount) = abi.decode(ats.data, (string,bytes32,bytes32,address,uint64,string,string,bool));
        if (keccak256(bytes(asset)) != keccak256(bytes("ETH")) || !balanceGreaterThanBaseAmount) {
            return false;
        }

        return true;
    }

    function setPADOAddress(address padoAddress) public onlyOwner returns (bool) {
        _PADOAddress = padoAddress;
        return true;
    }

    function getPADOAddress() public view returns (address) {
        return _PADOAddress;
    }

    function setEAS(IEAS eas) public onlyOwner returns (bool) {
        _eas = eas;
        return true;
    }

    function getEAS() public view returns (IEAS) {
        return _eas;
    }
}