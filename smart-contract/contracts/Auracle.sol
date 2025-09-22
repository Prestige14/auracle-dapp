// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract Auracle is ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private constant REPUTATION_CHANGE = 5;
    uint256 private constant PM25_TOLERANCE = 15;
    uint256 private constant MAX_NEIGHBORS_TO_CHECK = 5;
    uint256 private constant STALE_DATA_THRESHOLD = 1 hours;


    uint256 private _nextTokenId;
    string private _contractBaseURI; 

    struct SensorMetadata {
        string latitude;
        string longitude;
        uint256 lastPm25Value;
        uint256 lastUpdated;
        uint256 uptimeScore;
        uint256 reputationScore;
        string geohash;
    }

    mapping(uint256 => SensorMetadata) public sensorData;
    mapping(string => uint256[]) public sensorsByGeohash;

    event DataSubmitted(uint256 tokenId, uint256 pm25Value);
    
    constructor() ERC721("Auracle Sensor", "AURA") Ownable(msg.sender) {}

    /**
     * @dev Mengembalikan beberapa karakter pertama (prefix) dari sebuah string.
     * @param str String sumber.
     * @param length Jumlah karakter yang ingin diambil.
     */
    function getPrefix(string memory str, uint256 length) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(length <= strBytes.length, "Prefix length exceeds string length");
        bytes memory result = new bytes(length);
        for(uint i = 0; i < length; i++) {
            result[i] = strBytes[i];
        }
        return string(result);
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _contractBaseURI = newBaseURI;
    }

    function registerSensor(
        string memory _latitude,
        string memory _longitude,
        string memory _geohash
    ) public returns (uint256) {
        uint256 newItemId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(msg.sender, newItemId);

        sensorData[newItemId] = SensorMetadata({
            latitude: _latitude,
            longitude: _longitude,
            lastPm25Value: 0,
            lastUpdated: block.timestamp,
            uptimeScore: 100,
            reputationScore: 100,
            geohash: _geohash
        });
        
        string memory geohashPrefix = getPrefix(_geohash, 5);
        sensorsByGeohash[geohashPrefix].push(newItemId);

        return newItemId;
    }
    
    function submitData(uint256 _tokenId, uint256 _pm25Value) public {
        require(_ownerOf(_tokenId) == msg.sender, "Only the owner can submit data.");

        SensorMetadata storage sensor = sensorData[_tokenId];
        
        string memory geohashPrefix = getPrefix(sensor.geohash, 5);
        uint256[] memory neighborIds = sensorsByGeohash[geohashPrefix];
        
        uint validNeighbors = 0;
        uint agreements = 0;
        uint disagreements = 0;

        uint neighborsToCheck = neighborIds.length < MAX_NEIGHBORS_TO_CHECK ? neighborIds.length : MAX_NEIGHBORS_TO_CHECK;

        for (uint i = 0; i < neighborsToCheck; i++) {
            uint256 neighborId = neighborIds[i];

            if (neighborId == _tokenId) {
                continue;
            }

            SensorMetadata memory neighborSensor = sensorData[neighborId];
            
            if (
                block.timestamp - neighborSensor.lastUpdated < STALE_DATA_THRESHOLD &&
                neighborSensor.lastPm25Value > 0 
            ) {
                validNeighbors++;
                
                uint diff = _pm25Value > neighborSensor.lastPm25Value
                    ? _pm25Value - neighborSensor.lastPm25Value
                    : neighborSensor.lastPm25Value - _pm25Value;

                if (diff <= PM25_TOLERANCE) {
                    agreements++;
                } else {
                    disagreements++;
                }
            }
        }

        if (validNeighbors > 0) {
            if (agreements > disagreements) { 
                if (sensor.reputationScore <= 100 - REPUTATION_CHANGE) {
                    sensor.reputationScore += REPUTATION_CHANGE;
                } else {
                    sensor.reputationScore = 100;
                }
            } else if (disagreements > agreements) {
                if (sensor.reputationScore >= REPUTATION_CHANGE) {
                    sensor.reputationScore -= REPUTATION_CHANGE;
                } else {
                    sensor.reputationScore = 0;
                }
            }
        }

        sensor.lastPm25Value = _pm25Value;
        sensor.lastUpdated = block.timestamp;

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