const openAI = require('./openAI');
const {limitFloatTo2, roundOf005, cleanItemString, parseItemString, createPrompt, writeToFile} = require('./helper');


const itemTypes = {
    book: 'book',
    food: 'food',
    medicalProducts: 'medicalProducts',
};

const itemTypeMapper = {
    'book': itemTypes.book,
    'music CD': itemTypes.na,
    'chocolate bar': itemTypes.food,

    'chocolates': itemTypes.food,
    'perfume': itemTypes.na,

    'headache pills': itemTypes.medicalProducts
};



const salesTaxPercentage = 0.10;
const importTaxPercentage = 0.05;


class RecieptGeneratorBase {
    constructor(){
        this.generated = false;
        this.items = [];
        this.salesTax = 0;
        this.importTax = 0;
        this.total = 0;
    }

    print(outputpath = './output.txt'){
        try{
            if(!this.generated) throw new Error('cannot print when receipt not generated');

            let receiptStr = '';
            this.items.forEach((item) => {
                const {quantity, item: displayName, isImported, total} = item;
                receiptStr += `${quantity} ${(isImported)? 'imported ' : ''}${displayName}: ${total} \n`;
            });
    
            receiptStr += `Sales Tax: ${this.salesTax + this.importTax} \n`;
            receiptStr += `Total:${this.total}`;
    
            console.log(receiptStr);
            // console.log(JSON.stringify(this.items));

            writeToFile(receiptStr, outputpath);
        }
        catch(err){
            console.log('RecieptGeneratorBase:print:err: unable to print', err);
            throw err;
        }
    }

    clear(){
        this.items = [];
        this.salesTax = 0;
        this.total = 0;
        this.generated = false;
    }
}


class RecieptGeneratorV0 extends RecieptGeneratorBase {
    constructor(){
        super();
    }

    generate(input){
        try{
            if(this.generated) this.clear();
            const items = input.split("\n");
            // console.log(items);


            items.forEach((itemStr) => {
                //parse item to get required information
                const itemString = cleanItemString(itemStr);
                const itemDetails = parseItemString(itemString);
            
                const {item, unitPrice, isImported, quantity} = itemDetails;

                //check for item type
                const unitItem = (item.indexOf(' of ') === -1)? item : item.split(' of ')[1] //splitting at the 'of' to get the item name, this is done to parse grouped items in v0 ex bag of chocolates and box of choclates. Will not be done in v1

                const itemTotalCostPT = unitPrice * quantity;
                itemDetails.totalPreTax = itemTotalCostPT;

                const itemType = (itemTypeMapper[unitItem])? itemTypeMapper[unitItem] : null;

                itemDetails.type = itemType;

                //calculate taxes and total
                let salesTax = 0;
                let importTax = 0;
                switch(itemType){
                    case itemTypes.book:
                    case itemTypes.food:
                    case itemTypes.medicalProducts: 
                        break;
                    default: 
                        salesTax = roundOf005(itemTotalCostPT * salesTaxPercentage); //rounding up sales tax to the nearest .05
                }
                

                importTax = (isImported)? roundOf005(itemTotalCostPT * importTaxPercentage) : 0;
                itemDetails.salesTax = salesTax;
                itemDetails.importTax = importTax;

                itemDetails.total = limitFloatTo2(itemTotalCostPT + salesTax + importTax);
                
                this.total = limitFloatTo2(this.total + itemDetails.total)
                this.importTax = limitFloatTo2(this.importTax + importTax);
                this.salesTax = limitFloatTo2(this.salesTax + salesTax);

                this.items.push(itemDetails);
            });

            this.generated = true;
        }
        catch(err){
            console.log('RecieptGeneratorV0:generate:err generating receipt: ', err);
            this.clear();

            throw err;
        }
    }
}

class RecieptGeneratorV1 extends RecieptGeneratorBase {
    constructor(){
        super();
    }

    async generate(input){
        try{
            if(this.generated) this.clear();
            const items = input.split("\n");
            // console.log(items);

            await Promise.all(items.map(async (itemStr) => {
                const itemString = cleanItemString(itemStr);
                const itemDetails = parseItemString(itemString);
            
    
                const {item, unitPrice, isImported, quantity} = itemDetails;
                let itemType = null;
    
                
                const itemTotalCostPT = unitPrice * quantity;
                itemDetails.totalPreTax = itemTotalCostPT;

                const itemTypesArr = Object.keys(itemTypes);
    
                for(let i = 0; i < itemTypesArr.length; i++){
                    const prompt = createPrompt(item, itemTypesArr[i]);
                    const response = await openAI.completion(prompt);

                    // console.log('response: ', response);
                    
                    if(parseInt(response) == 1){
                        itemType = itemTypesArr[i];
                        break;
                    }
                }
    
                itemDetails.type = itemType;
    
                //calculate taxes and total
                let salesTax = 0;
                let importTax = 0;
                switch(itemType){
                    case itemTypes.book:
                    case itemTypes.food:
                    case itemTypes.medicalProducts: 
                        break;
                    default: 
                        salesTax = roundOf005(itemTotalCostPT * salesTaxPercentage); //rounding up sales tax to the nearest .05
                }

                importTax = (isImported)? roundOf005(itemTotalCostPT * importTaxPercentage) : 0;

                itemDetails.salesTax = salesTax;
                itemDetails.importTax = importTax;

                itemDetails.total = limitFloatTo2(itemTotalCostPT + salesTax + importTax);
                
                this.total = limitFloatTo2(this.total + itemDetails.total)
                this.importTax = limitFloatTo2(this.importTax + importTax);
                this.salesTax = limitFloatTo2(this.salesTax + salesTax);
    
                this.items.push(itemDetails);
                })
            )

            this.generated = true;
        }
        catch(err){
            console.log('ReceiptGeneratorV1:generateL err generating receipt: ', err);
            this.clear();

            throw err;
        }
    }
}

module.exports = {
    V0: RecieptGeneratorV0,
    V1: RecieptGeneratorV1
}