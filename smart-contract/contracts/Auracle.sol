// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract Auracle is ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    
    string private _contractBaseURI; 

    struct SensorMetadata {
        string latitude;
        string longitude;
        uint256 lastPm25Value;
        uint256 lastUpdated;
        uint256 uptimeScore;
        uint256 reputationScore;
    }

    mapping(uint256 => SensorMetadata) public sensorData;

    event DataSubmitted(uint256 tokenId, uint256 pm25Value);
    
    // <<< PERUBAHAN DI SINI: Tambahkan Ownable(msg.sender)
    constructor() ERC721("Auracle Sensor", "AURA") Ownable(msg.sender) {
        // Constructor body bisa kosong
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _contractBaseURI = newBaseURI;
    }

    function registerSensor(string memory _latitude, string memory _longitude) public returns (uint256) {
        uint256 newItemId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(msg.sender, newItemId);

        sensorData[newItemId] = SensorMetadata({
            latitude: _latitude,
            longitude: _longitude,
            lastPm25Value: 0,
            lastUpdated: block.timestamp,
            uptimeScore: 100,
            reputationScore: 100
        });
        
        return newItemId;
    }

    function submitData(uint256 _tokenId, uint256 _pm25Value) public {
        require(_ownerOf(_tokenId) == msg.sender, "Only the owner of the sensor NFT can submit data.");
        
        sensorData[_tokenId].lastPm25Value = _pm25Value;
        sensorData[_tokenId].lastUpdated = block.timestamp;

        emit DataSubmitted(_tokenId, _pm25Value);
    }
    
    function getSensorData(uint256 _tokenId) public view returns (SensorMetadata memory) {
        return sensorData[_tokenId];
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _contractBaseURI;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}