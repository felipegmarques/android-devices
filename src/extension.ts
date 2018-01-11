'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn, exec } from 'child_process';

var emulator =  null;
var availableDevices = null;
var deviceChannel = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "android-devices" is now active!');

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.runDevice', async () => {
            if (availableDevices === null) {
                availableDevices = await getDevices();
            }
            let device = await vscode.window.showQuickPick(availableDevices, { placeHolder: 'Select a device'});
            if (device) {
                let deviceChannel = vscode.window.createOutputChannel("Android Device");
                deviceChannel.show();
                const emulator = spawn('emulator', [`@${device}`]);
                pipeProcessToChannel(emulator, deviceChannel);
            }
        },
        vscode.commands.registerCommand('extension.refreshList', async () => {
            availableDevices = await getDevices();
            vscode.window.showInformationMessage('Device list loaded!');
        })),
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (emulator) {
        emulator.kill();
        emulator = null;
    }
}

async function getDevices() {
    return new Promise((resolve, reject) => {
        exec('emulator -list-avds', (err, stdout, stderr) => {
            if (err || stderr.length !== 0) {
                reject(err || stdout);
            }
            resolve(stdout.length === 0 ? [] : stdout.split('\n').filter((val) => val.length !== 0));
        })
    });
}

function pipeProcessToChannel({ stdout, stderr }, channel) {
    stdout.on('data', (msg) => channel.append(msg.toString()));
    stderr.on('data', (msg) => channel.append(msg.toString()));
}