const fs = require('fs');

//file to store all helper functions
const limitFloatTo2 = (num) => {
    return parseFloat(num.toFixed(2));
};

//function to round of to the nearest 0.05
const roundOf005 = (amount) => limitFloatTo2(Math.ceil(amount * 20)/20);

const cleanItemString = (itemStr) => {
    const endChars = itemStr.slice(-2);
    return (endChars !== '\r')? itemStr : itemStr.slice(0, -2); 
};

//function to parse item string to get quantity, unit price, wether item is imported, and its display name
const parseItemString = (itemStr) => {
    try{
        let quantity = 0;
        let unitPrice = 0;
        let item = '';
        let isImported = false;
    
        //get quantity from the first space
        const quantityBreakPoint = itemStr.indexOf(' ');
        if(quantityBreakPoint === -1) throw new Error('incorrect input format');
    
        quantity = parseInt(itemStr.slice(0, quantityBreakPoint));
        if(quantity === NaN) throw new Error('incorrect input format, unable to get quantity');
        console.log('quantity: ', quantity);
    
        itemStr = itemStr.slice(quantityBreakPoint)
        console.log('itemStr: ', itemStr);
    
        //get price by splitting using at
        const valueBreakPoint = itemStr.indexOf(' at '); //cannot use plain 'at' items can have the term at in them
        if(!valueBreakPoint) throw new Error('incorrect input format, unable to get value');
    
        let [displayString, valueString] = itemStr.split(' at ');
        console.log('valueString: ', valueString);
    
        unitPrice = parseFloat(valueString);
        if(isNaN(unitPrice)) throw new Error('incorrect input format, unable to convert value');
    
        displayString = displayString.trim();
    
        //check wether imported or not
        if(displayString.indexOf('imported') !== -1){
            isImported = true;
            displayString = displayString.replace(' imported ', '');
        }

        item = displayString;
    
        return {
            quantity,
            unitPrice,
            item,
            isImported
        };
    }
    catch(err){
        console.log('helper:parseItemString:err parsing item string ', err);
    }

};





//function to create question strings
const createPrompt = (item, itemType) => `is ${item} a type of ${itemType} ? answer 1 for yes, 0 for no`;

const writeToFile = (data, outputPath) => {
    try{
        fs.writeFileSync(outputPath, data);
    }
    catch(err){
        console.log('helper:writeToFile: err writing to output file ', err);
        throw err;
    }
}

module.exports = {
    limitFloatTo2,
    roundOf005,
    cleanItemString,
    parseItemString,
    createPrompt,
    writeToFile
}