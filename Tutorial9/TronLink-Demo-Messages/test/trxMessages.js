const TRXMessages = artifacts.require("TRXMessages.sol");
const Web3 = require('web3');
const BigNumber = require('big-number');
const maxGasPerBlock = 6700000;

contract('TRXMessages', function(accounts) 
{
  const new_web3 = new Web3(web3.currentProvider);
  let trxMessagesInstance;
  let trxMessagesContract;
  
  const testPost = "Yo, yo.";

  beforeEach(async () =>
  {
    trxMessagesInstance = await TRXMessages.new();
    trxMessagesContract = new new_web3.eth.Contract(trxMessagesInstance.abi, trxMessagesInstance.address);
  });

  it("should deploy", async () =>
  {});

  it("should post", async () =>
  {
    await trxMessagesInstance.postMessage(testPost, {value: 1000000});
  });

  it("should get post", async () =>
  {
    await trxMessagesInstance.postMessage(testPost, {value: 1000000});
    assert.equal((await trxMessagesInstance.messages(1))[1], testPost);
  });

  it("should tip", async () =>
  {
    await trxMessagesInstance.postMessage(testPost, {value: 1000000, from: accounts[1]});
    const balanceBefore = new BigNumber(await new_web3.eth.getBalance(accounts[1]));
    await trxMessagesInstance.tipMessage(1, {value: 420});
    const balanceAfter = new BigNumber(await new_web3.eth.getBalance(accounts[1]));
    
    assert.equal(balanceAfter.minus(balanceBefore).toString(), Math.ceil(420 * .99).toString());
  });
  
  it("should allow self-tip", async () =>
  {
    await trxMessagesInstance.postMessage(testPost, {value: 1000000, from: accounts[1]});
    const balanceBefore = new BigNumber(await new_web3.eth.getBalance(accounts[1]));
    const tx = await trxMessagesInstance.tipMessage(1, {value: 420, from: accounts[1]});
    const balanceAfter = new BigNumber(await new_web3.eth.getBalance(accounts[1]));

    const txInfo = await new_web3.eth.getTransaction(tx.tx);
    const gas = tx.receipt.gasUsed * txInfo.gasPrice;

    assert.equal(balanceAfter.minus(balanceBefore).toString(), (Math.ceil(420 * -.01) - gas).toString());
    assert.equal((await trxMessagesInstance.messages(1))[2].toString(), "420");
  });

  it("should enforce owner only", async () =>
  {
    try
    {
      await trxMessagesInstance.withdraw({from: accounts[1]});
    }
    catch(error)
    {
      return;
    }

    assert.fail();
  });

  it("should allow owner withdraw", async () =>
  {
    await trxMessagesInstance.postMessage(testPost, {value: 1000000, from: accounts[1]});
    await trxMessagesInstance.tipMessage(1, {value: 420, from: accounts[2]});
    
    const balanceBefore = new BigNumber(await new_web3.eth.getBalance(accounts[0]));
    const tx = await trxMessagesInstance.withdraw({from: accounts[0]});
    const balanceAfter = new BigNumber(await new_web3.eth.getBalance(accounts[0]));
    
    const txInfo = await new_web3.eth.getTransaction(tx.tx);
    const gas = tx.receipt.gasUsed * txInfo.gasPrice;

    assert.equal(balanceAfter.minus(balanceBefore).toString(), (1000000 + Math.floor(420 * .01) - gas).toString());    
  });

  it("should track the top 20 tips", async () =>
  {
    for(let i = 1; i < 21; i++)
    {
      await trxMessagesInstance.postMessage(testPost, {value: 1000000, from: accounts[1]});
      await trxMessagesInstance.tipMessage(i, {value: 420, from: accounts[2]});
    }
    await trxMessagesInstance.postMessage(testPost, {value: 1000000, from: accounts[1]});
    await trxMessagesInstance.tipMessage(21, {value: 1000, from: accounts[2]});

    assert.equal((await trxMessagesInstance.topPosts(0)).toString(), "21");
  });
});
