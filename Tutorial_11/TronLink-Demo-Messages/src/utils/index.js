const contractAddress = 'TA2zHDeqLw5DUd8FrRjP7Zn3FV64S3wj6K'

const utils = {
    tronWeb: false,
    contract: false,

    async setTronWeb(tronWeb) {
        this.tronWeb = tronWeb;
        this.contract = await tronWeb.contract().at(contractAddress)
    },

};

export default utils;

