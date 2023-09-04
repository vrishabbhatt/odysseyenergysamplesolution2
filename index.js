const fs = require('fs');
const env = require('./env.json');
const RecieptGenerators = require('./receiptGenerator');

//main function
(async () => {
    try{
        let {receiptGeneratorVersion} = env;
        const {V0: RecieptGeneratorV0, V1: RecieptGeneratorV1} = RecieptGenerators;

        if(receiptGeneratorVersion == null) receiptGeneratorVersion = 'v0';
        let receiptGenerator = null;

        switch(receiptGeneratorVersion){
            case 'v0':
                receiptGenerator = new RecieptGeneratorV0();
                break;
            case 'v1':
                receiptGenerator = new RecieptGeneratorV1();
                break;
            default:
                throw new Error('receipt generator version not supported');
        }

        const input = fs.readFileSync('./input.txt', 'utf-8');

        await receiptGenerator.generate(input);
        receiptGenerator.print();
    }
    catch(err){
        console.log('main err:', err);
    }
})();