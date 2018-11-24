import React from 'react';
import moment from 'moment';

import { Scrollbars } from 'react-custom-scrollbars';

import './Message.scss';

const Message = props => {
    const {
        message: {
            message,
            owner,
            timestamp,
            tips
        },
        messageID,
        featured,
        tippable,
        requiresTronLink,
        onTip
    } = props;

    return (
        <div className='message-wrapper'>
            <div className={ 'message' + (tippable ? ' tippable' : '') + (requiresTronLink ? ' requiresTronLink' : '') } onClick={ () => onTip(messageID) }>
                <div className='header'>
                    <div className='owner'>
                        { owner }
                    </div>
                    { featured && <div className='star'>
                        &#9733;
                    </div> }
                </div>
                <Scrollbars style={{ width: 330, height: 85, marginBottom: 6 }} autoHide>
                    <div className='body'>
                        { message }
                    </div>
                </Scrollbars>
                <div className='footer'>
                    <div className='timestamp'>
                        { moment(timestamp * 1000).fromNow() }
                    </div>
                    { tips.count ? <div className='tips'>
                        <strong>{ (tips.amount / 1000000).toLocaleString() } TRX</strong> from { tips.count.toLocaleString() } tip{ tips.count === 1 ? '' : 's' }
                    </div> : '' }
                </div>
            </div>
        </div>
    );
};

export default Message;