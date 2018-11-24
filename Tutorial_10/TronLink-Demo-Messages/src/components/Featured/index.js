import React from 'react';
import Message from 'components/Message';

import { Scrollbars } from 'react-custom-scrollbars';

import './Featured.scss';

const Featured = props => {
    const {
        recent,
        featured,
        currentAddress,
        tronLinkInstalled,
        onTip
    } = props;

    const messages = featured.sort((a, b) => recent[b].tips.amount - recent[a].tips.amount).map(messageID => (
        <Message
            message={ recent[messageID] }
            featured={ true }
            key={ messageID }
            messageID={ messageID }
            tippable={ recent[messageID].owner !== currentAddress }
            requiresTronLink={ !tronLinkInstalled }
            onTip={ onTip } />
    ));

    return (
        <div className='featured'>
            <Scrollbars style={{ height: 220, width: '100%' }} autoHide>
                <div className='scrollable'>
                    { messages }
                </div>
            </Scrollbars>            
        </div>
    );
};

export default Featured;