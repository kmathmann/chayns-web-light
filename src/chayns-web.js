import logger from 'chayns-logger';
import io from 'socket.io-client';
import loadTapp, { getTappById } from './tapp/custom-tapp';
import { loadLocation } from './chayns-info';
import { setDynamicStyle } from './ui/dynamic-style';
import Navigation from './ui/navigation';
import { validateTobitAccessToken, getUrlParameters } from './utils/helper';
import { getTobitAccessToken } from './json-native-calls/calls/index';
import { showLogin } from './login';
import ConsoleLogger from './utils/console-logger';

import LOGIN_TAPP from './constants/login-tapp';

const consoleLogger = new ConsoleLogger('(chayns-web.js)');

function initConnection() {
    const dfaceUid = getUrlParameters().dfaceuid;
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.debug('connected');
        socket.emit('register', dfaceUid);
    });

    socket.on('config', ({ locationId, tappId }) => {
        console.debug('registered', locationId, tappId);
        init(locationId, tappId)
    });

}

function init(locationId, tappId) {

    logger.info({
        message: 'ChaynsWebLight requested',
        locationId,
        customNumber: tappId,
    });


    Navigation.init();

    loadLocation(locationId).then(async(success) => {
        try {
            if (!success) {
                return;
            }

            setDynamicStyle();

            const getTobitAccessTokenRes = await getTobitAccessToken();
            const tobitAccessToken = getTobitAccessTokenRes.data.tobitAccessToken;

            const tapp = getTappById(tappId);
            if (!tapp) {
                consoleLogger.warn('No Tapp found!');
                logger.warning({
                    message: 'no tapp found',
                    locationId,
                    customNumber: tappId,
                    fileName: 'custom-tapp.js',
                    section: 'loadTapp'
                });
                return;
            }

            if (tappId === LOGIN_TAPP.id || (tapp.requiresLogin && !validateTobitAccessToken(tobitAccessToken))) {
                logger.info({
                    message: 'show login tapp',
                    locationId,
                    customNumber: tappId
                });

                showLogin();
            } else {
                loadTapp(tappId);
            }
        } catch (e) {
            consoleLogger.error(e);
            logger.error({
                message: 'Init of ChaynsWebLight failed.',
                locationId,
                customNumeber: tappId,
                fileName: 'chayns-web.js',
                section: 'loadLocation(locationId)',
                ex: {
                    message: e.message,
                    stackTrace: e.stack
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => initConnection(), false);
