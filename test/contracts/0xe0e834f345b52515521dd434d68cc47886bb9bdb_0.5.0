pragma solidity ^0.5.0;

import "./Ownable.sol";

contract education is Ownable {
    struct CertificateDetails {
        bytes  student_copy;
        bytes  issuer_copy;
        uint256 courseID;
        string  serialNumber;
        uint256 expiry;
        bool   invalidated;
    }

    mapping(address => bool) private issuers;

    // Array with all certificate ids, used for enumeration
    uint256[] private _allCertificates;

    // Mapping from certificate id to position in the allCertificates array
    mapping(uint256 => uint256) private _allCertificatesIndex;

    // The certificates
    mapping(uint256 => CertificateDetails) private _certificates;
    mapping(bytes32 => uint) public _certificatesBySerialHash;
    mapping (uint256 => address) private _certificateOwners;
    // Mapping from owner to list of owned certificate IDs
    mapping(address => uint256[]) private _ownedCertificates;
    mapping (uint256 => address) private _certificateIssuers;
    mapping (uint256 => uint256) private _ownedCertificatesIndex;
    mapping (uint256 => uint256[]) private _certificatesForCourse;

    uint256 private _latestCourseID;

    event Issue(address issuer, address recipient, uint256 certificateID, uint256 courseID);
    event CertificateInvalidated(uint256 certificateID);
    event NewCourseID(address creator,uint256 courseID);

    modifier onlyIssuer {
        require(issuers[msg.sender],"only certificate issuers can create certificates");
        _;
    }


    function addIssuer(address issuer) external onlyOwner {
        issuers[issuer] = true;
    }

    function removeIssuer(address issuer) external onlyOwner {
        issuers[issuer] = false;
    }

   /**
     * @dev Gets the certificate ID at a given index of the certificates list of the requested owner.
     * @param owner address owning the certificates list to be accessed
     * @param index uint256 representing the index to be accessed of the requested certificates list
     * @return uint256 certificate ID at the given index of the certificates list owned by the requested address
     */
    function certificateOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < numberOfCertificatesOwnedBy(owner), "Certificate owner index out of bounds");
        return _ownedCertificates[owner][index];
    }

    /**
     * @dev Gets the total amount of certificates stored by the contract.
     * @return uint256 representing the total amount of certificates
     */
    function numberOfCertificates() public view  returns (uint256) {
        return _allCertificates.length;
    }

    /**
     * @dev Gets the certificate ID at a given index of all the certificates in this contract
     * Reverts if the index is greater or equal to the total number of certificates.
     * @param index uint256 representing the index to be accessed of the certificates list
     * @return uint256 certificate ID at the given index of the certificates list
     */
    function certificateByIndex(uint256 index) public view  returns (uint256) {
        require(index < numberOfCertificates(), "Certificate index out of bounds");
        return _allCertificates[index];
    }

    /**
     * @dev Gets the list of certificate IDs of the requested owner.
     * @param owner address owning the certificates
     * @return uint256[] List of certificate IDs owned by the requested address
     */
    function _certificatesOfOwner(address owner) internal view returns (uint256[] storage) {
        return _ownedCertificates[owner];
    }

    /**
     * @dev Private function to add a certificate to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given certificate ID
     * @param certificateID uint256 ID of the certificate to be added to the certificates list of the given address
     */
    function _addCertificateToOwnerEnumeration(address to, uint256 certificateID) private {
        _ownedCertificatesIndex[certificateID] = _ownedCertificates[to].length;
        _ownedCertificates[to].push(certificateID);
    }

    /**
     * @dev Private function to add a certificate to this extension's certificate tracking data structures.
     * @param certificateID uint256 ID of the certificate to be added to the certificates list
     */
    function _addCertificateToAllCertificatesEnumeration(uint256 certificateID) private {
        _allCertificatesIndex[certificateID] = _allCertificates.length;
        _allCertificates.push(certificateID);
    }

    function getCertificate(uint256 certificateID) internal view  returns (CertificateDetails memory) {
        require(_exists(certificateID),"certificate does not exist");
        require(!_certificates[certificateID].invalidated,"certificate not valid");
        return _certificates[certificateID];
    }

    function getStudentCopy(uint256 certificateID) external view returns (bytes memory studentVersion) {
        return getCertificate(certificateID).student_copy;
    }

    function getIssuerCopy(uint256 certificateID) external view returns (bytes memory issuerVersion) {
        return getCertificate(certificateID).issuer_copy;
    }

    function getSerialNumber(uint256 certificateID) external view returns (string memory serialNumber) {
        return getCertificate(certificateID).serialNumber;
    }

    function getCourseID(uint256 certificateID) external view returns (uint256 courseID) {
        return getCertificate(certificateID).courseID;
    }

    function getCertificateExpiry(uint256 certificateID) external view returns (bool valid, uint256 expiryDate) {
        require(_exists(certificateID),"certificate does not exist");
        valid = !_certificates[certificateID].invalidated;
        expiryDate = _certificates[certificateID].expiry;
    }


    function ownerOf(uint256 certificateID) public view  returns (address) {
        address owner = _certificateOwners[certificateID];
        require(owner != address(0), "Owner query for nonexistent certificate");

        return owner;
    }

    function issuerOf(uint256 certificateID) public view  returns (address) {
        address issuer = _certificateIssuers[certificateID];
        require(issuer != address(0), "Issuer query for nonexistent certificate");
        return issuer;
    }

    function numberOfCertificatesOwnedBy(address owner) public view  returns (uint256) {
        require(owner != address(0), "Balance query for address zero");
        return _ownedCertificates[owner].length;
    }

    function numberOfCourses() public view returns (uint256) {
        return _latestCourseID;
    }

    function numberOfAttendees(uint256 courseID) public view returns (uint256) {
        return _certificatesForCourse[courseID].length;
    }

    function certificateForCourse(uint256 courseID, uint256 index) public view returns (uint256) {
        require(index < numberOfAttendees(courseID),"invalid certificate index");
        return _certificatesForCourse[courseID][index];
    }

    /**
     * @dev Returns whether the specified certificate exists.
     * @param certificateID uint256 ID of the certificate to query the existence of
     * @return bool whether the certificate exists
     */
    function _exists(uint256 certificateID) internal view returns (bool) {
        address owner = _certificateOwners[certificateID];
        return owner != address(0);
    }


    function _mint(address to, uint256 certificateID, uint256 courseID) internal {
        require(to != address(0), "Certificates cannot be issued to address zero");
        require(!_exists(certificateID), "This certificate is already issued");

        _certificateOwners[certificateID] = to;
        _certificateIssuers[certificateID] = msg.sender;

        emit Issue(msg.sender, to, certificateID, courseID);
    }


    function _setCertificateData(
        uint256 certificateID,
        string memory serialNumber,
        bytes memory studentCopy,
        bytes memory issuerCopy,
        uint256 courseID,
        uint256 expiryDate)
        internal {
        bytes32 hash = keccak256(bytes(serialNumber));
        require(_exists(certificateID),"Certificate ID does not exist");
        require(_certificatesBySerialHash[hash] == 0, "This serial number has already been allocated");
        _certificates[certificateID].issuer_copy = issuerCopy;
        _certificates[certificateID].student_copy = studentCopy;
        _certificates[certificateID].serialNumber = serialNumber;
        _certificates[certificateID].expiry = expiryDate;
        _certificates[certificateID].courseID = courseID;
        _certificatesBySerialHash[hash] = certificateID;
        _certificatesForCourse[courseID].push(certificateID);
    }

    function createCertificate(
        address recipient,
        string calldata serialNumber,
        bytes calldata studentCopy,
        bytes calldata issuerCopy,
        uint256 courseID,
        uint256 expiryDate) external onlyIssuer {
        uint256 newCert = numberOfCertificates();
        _addCertificateToAllCertificatesEnumeration(newCert);
        _addCertificateToOwnerEnumeration(recipient,newCert);
        _mint(recipient,newCert,courseID);
        _setCertificateData(newCert,serialNumber,studentCopy,issuerCopy,courseID,expiryDate);
    }

    function invalidateCertificate(uint256 certificateID) public onlyIssuer {
        require(_certificateIssuers[certificateID]==msg.sender,"You did not issue this certificate");
        _certificates[certificateID].invalidated = true;
        emit CertificateInvalidated(certificateID);
    }

    function Version() external pure returns (uint256) {
        return 6;
    }

    function newCourseID() public onlyIssuer {
        _latestCourseID = _latestCourseID+1;
        emit NewCourseID(msg.sender,_latestCourseID);
    }

    

}