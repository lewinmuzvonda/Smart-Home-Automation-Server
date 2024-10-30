const ewelink = require('ewelink-api');
const express = require('express');
const api = require('./routes/api');
const admin = require('firebase-admin');
const serviceAccount = require('./assets/arkenergy-5ea5e-firebase-adminsdk-vjzrt-a4084526e8.json');


const app = express();
const port = process.env.PORT || 3000;

let leftWindowStatus;
let rightWindowStatus;
let acStatus;

const devices = [
    { id: '1001d88b1f', name: 'Left Kitchen Window' },
    { id: '1001f4512c', name: 'AC' },
    { id: '1001f83987', name: 'Right Kitchen Window' },
];

const conn = new ewelink({
    email: 'nadim.khoury@arkenergy.ae',
    password: 'nadim@nadim',
    region: 'as',
  });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

setInterval(async () => {
    try {
        console.log('checking AC');
        await checkAC();
    } catch (error) {
        console.error(`Error checking AC: ${error}`);
    }
}, 180000);

async function sendNotification(messageContent) {
    const message = {
        notification: {
            title: 'Event Alert',
            body: messageContent,
        },
        topic: 'window-alert',
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Notification sent successfully:', response);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

let windowKitchenLeft = '1001d88b1f';
let smartSwitch = '1001f4512c';
let windowKitchenRight = '1001f83987';



const connection = new ewelink({
    email: 'nadim.khoury@arkenergy.ae',
    password: 'nadim@nadim',
    region: 'as',
  });

openWebSocket();

async function checkWindow(deviceId) {
    try {
        const device = await conn.getDevice(deviceId);

        if( deviceId === windowKitchenLeft ){

            if( device.params?.switch == 'on' && acStatus == 'on'){

                toggleDevice(deviceId);

                leftWindowStatus = device.params.switch;

                return {
                    deviceId,
                    type: 'Left Kitchen Window',
                    SwitchStatus: device.params.switch,
                    success: true 
                };
            }

            
        }else if( deviceId === windowKitchenRight  && acStatus == 'on' ){

            if( device.params?.switch == 'on'){

                toggleDevice(deviceId);

                rightWindowStatus = device.params.switch;

                return {
                    deviceId,
                    type: 'Right Kitchen Window',
                    SwitchStatus: device.params.switch,
                    success: true 
                };
            }
            
        }
        
    } catch (error) {
        // console.error(`Failed to get data for ${devices.find(device => device.id === deviceId).name}:`, error);
        return { 
            error: `Unable to fetch data for ${devices.find(device => device.id === deviceId).name}`,
            success: false 
         };
    }
}

async function checkAC() {
    try {
        const device = await conn.getDevice('1001f4512c');

        acStatus = device.params?.switches[0]['switch'] ?? 'unknown';
        console.log(acStatus);

        return {
            deviceId,
            type: 'AC',
            SwitchStatus: device.params?.switches[0]['switch'] ?? 'Unknown',
            currentKwh: device.params.current,
            voltage: device.params.voltage,
            power: device.params.power,
            dailyConsumption: device.params.dayKwh,
            monthlyConsumption: device.params.monthKwh,
            getHoursKwh: device.params.getHoursKwh,
            threshold: device.params.threshold,
            rssi: device.params.rssi,
            success: true 
        };

        
    } catch (error) {
        // console.error(`Failed to get data for ${devices.find(device => device.id === deviceId).name}:`, error);
        return { 
            error: `Unable to fetch data for ${devices.find(device => device.id === deviceId).name}`,
            success: false 
         };
    }
}

async function toggleDevice(deviceId){

    // console.log('Toggle function running...');
    const status = await connection.toggleDevice(deviceId);
    console.log(status);

}

async function openWebSocket(){

    const auth = await connection.getCredentials();

    const socket = await connection.openWebSocket(async data => {
        if( data.action == 'update' ){

            //calls when window has been opened or ac switch status changed
            if( data.params?.switches[0]['switch'] != null ){
                if( data.deviceid != '1001f4512c' && data.params.switches[0]['switch'] == 'on'){

                    console.log(`${devices.find(device => device.id === data.deviceid).name} has been Opened`);
                    sendNotification(`${devices.find(device => device.id === data.deviceid).name} has been Opened`);

                    if( acStatus == 'on' ){

                        //check if window is still open after 3 minutes.
                        setTimeout(() => {
                            checkWindow(data.deviceid);
                        }, 180000);

                    }
                    
    
                }else if( data.deviceid != '1001f4512c' && data.params.switches[0]['switch'] == 'off'){
    
                    console.log(`${devices.find(device => device.id === data.deviceid).name} has been Closed`);
                    sendNotification(`${devices.find(device => device.id === data.deviceid).name} has been Closed`);
    
                }else if( data.deviceid == '1001f4512c' ){
                    console.log(`${devices.find(device => device.id === data.deviceid).name} is now ${data.params.switches[0]['switch']}`);
                    sendNotification(`${devices.find(device => device.id === data.deviceid).name} has been turned ${data.params.switches[0]['switch']}`);
                }
            }

            
        }
        

      });

}

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  
    next();
});

app.use('/api', api);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
  