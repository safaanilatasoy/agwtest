const fs = require('fs');
const parse = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ethers = require('ethers');

// Delegate Registry contract address and ABI'si
const delegateRegistryAddress = 'DELEGATE_REGISTRY_ADDRESS'; 
const delegateRegistryAbi = [/* ABI */];

// Ethereum provider  
const provider = new ethers.providers.InfuraProvider('mainnet', 'INFURA_PROJECT_ID');

// Delegate Registry contract 
const delegateRegistry = new ethers.Contract(delegateRegistryAddress, delegateRegistryAbi, provider);

// AGW_LINK hash 
const rights = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AGW_LINK')), 0, 24);

// EOA addresses
const eoaAddresses = [];


fs.createReadStream('eoa_addresses.csv')
  .pipe(parse())
  .on('data', (row) => {
    const eoaAddress = row['EOA Address'].trim();
    eoaAddresses.push(eoaAddress);
  })
  .on('end', () => {
    console.log('EOA addresses have been read, AGW addresses are being questioned...');
    getAgwAddresses();
  });

// AGW addresses array
const agwAddresses = [];

async function getAgwAddresses() {
  for (let eoa of eoaAddresses) {
    try {
      const agwAddress = await delegateRegistry.exclusiveWalletByRights(eoa, rights);
      agwAddresses.push({ 'EOA Address': eoa, 'AGW Address': agwAddress });
      console.log(`EOA: ${eoa} => AGW: ${agwAddress}`);
    } catch (error) {
      console.error(`No AGW found for EOA address: ${eoa}`, error);
      agwAddresses.push({ 'EOA Address': eoa, 'AGW Address': 'Not Found' });
    }
  }
  writeAgwAddressesToCsv();
}


function writeAgwAddressesToCsv() {
  const csvWriter = createCsvWriter({
    path: 'agw_addresses.csv',
    header: [
      { id: 'EOA Address', title: 'EOA Address' },
      { id: 'AGW Address', title: 'AGW Address' },
    ],
  });

  csvWriter
    .writeRecords(agwAddresses)
    .then(() => {
      console.log('AGW addresses were saved in the file "agw_addresses.csv".');
    })
    .catch((error) => {
      console.error('Error writing to CSV file:', error);
    });
}