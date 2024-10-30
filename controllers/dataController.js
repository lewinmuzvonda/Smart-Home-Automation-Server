const ewelink = require('ewelink-api');
const express = require('express');

let windowKitchenLeft = '1001d88b1f';
let smartSwitch = '1001f4512c';
let windowKitchenRight = '1001f83987';

const devices = [
    { id: '1001d88b1f', name: 'Left Kitchen Window' },
    { id: '1001f4512c', name: 'AC' },
    { id: '1001f83987', name: 'Right Kitchen Window' },
];

const connection = new ewelink({
    email: 'nadim.khoury@arkenergy.ae',
    password: 'nadim@nadim',
    region: 'as',
  });

async function getData(deviceId) {
    try {
        const device = await connection.getDevice(deviceId);

        if( deviceId === smartSwitch ){
            return {
                deviceId,
                type: 'AC',
                SwitchStatus: device.params.switches[0]['switch'],
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
        }else if( deviceId === windowKitchenLeft ){
            return {
                
                deviceId,
                type: 'Left Kitchen Window',
                SwitchStatus: device.params.switch,
                success: true 
            };
        }else if( deviceId === windowKitchenRight ){
            return {
                
                deviceId,
                type: 'Right Kitchen Window',
                SwitchStatus: device.params.switch,
                success: true 
            };
        }
        
    } catch (error) {
        // console.error(`Failed to get data for ${devices.find(device => device.id === deviceId).name}:`, error);
        return { 
            error: `Unable to fetch data for ${devices.find(device => device.id === deviceId).name}`,
            success: false 
         };
    }
}

const fetchData = async (req, res) => {
    try {
        const devices = await Promise.all([
            await getData(windowKitchenLeft),
            await getData(smartSwitch),
            await getData(windowKitchenRight),
        ]);
        res.json({ devices });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
};

const toggle = async (req, res) => {
    // console.error('Toogling AC');
    try {
        const status = await Promise.all([
            await toggleDevice(smartSwitch),
        ]);
        res.json({ status });
    } catch (error) {
        console.error('Error toggling AC:', error);
        res.status(500).json({ error: 'Failed to toggle AC' });
    }
};

async function toggleDevice(deviceId){

    // console.log('Toggle function running...');
    const status = await connection.toggleDevice(deviceId);
    console.log(status);

}

exports.fetchData = fetchData;
exports.toggle = toggle;