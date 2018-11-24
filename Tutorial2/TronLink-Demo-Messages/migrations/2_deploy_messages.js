var TRXMessages = artifacts.require("./TRXMessages.sol");

module.exports = function(deployer) {
  deployer.deploy(TRXMessages);
};
