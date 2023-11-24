// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IEAS } from "./IEAS.sol";
import { Attestation } from "./Common.sol";
import { IEASProxy} from "./IEASProxy.sol";

contract PADODemo is Ownable {
    // The global EAS contract.
    IEAS private _eas;
    address private _PADOAddress; // PADO attester address
    bytes32 private _PADOSchema; // PADO schema id
    IEASProxy private _iEasProxy;

    bool public result;

    constructor (IEAS eas, IEASProxy iEasPrxoy, bytes32 padoSchema) {
        _eas = eas;
        _iEasProxy = iEasPrxoy;
        _PADOSchema = padoSchema;
    }

    function testBusiness(address userAddress) public returns (bool) {
        if (testVerifyAttestation(userAddress)) {
            result = true;
        } else {
            result = false;
        }
    }

    function testVerifyAttestation(address userAddress) public view returns (bool) {
       bytes32[] memory uids = _iEasProxy.getPadoAttestations(userAddress, _PADOSchema);
        for (uint256 i = 0; i < uids.length; i++) {
            Attestation memory ats = _eas.getAttestation(uids[i]);
            (string memory source,bytes32 sourceUseridHash,bytes32 authUseridHash,address recipient,uint64 getDataTime,string memory asset,string memory baseAmount,bool balanceGreaterThanBaseAmount) = abi.decode(ats.data, (string,bytes32,bytes32,address,uint64,string,string,bool));
            if (keccak256(bytes(asset)) == keccak256(bytes("ETH")) && balanceGreaterThanBaseAmount) {
                return true;
            }
        }
        return false;
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