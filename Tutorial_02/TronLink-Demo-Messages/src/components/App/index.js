import React from 'react';
import Message from 'components/Message';
import Featured from 'components/Featured';
import TronLinkGuide from 'components/TronLinkGuide';
import TronWeb from 'tronweb';
import Utils from 'utils';
import Swal from 'sweetalert2';
import banner from 'assets/banner.png';

import './App.scss';

const FOUNDATION_ADDRESS = 'TWiWt5SEDzaEqS6kE5gandWMNfxR2B5xzg';

class App extends React.Component {
    state = {
        tronWeb: {
            installed: false,
            loggedIn: false
        },
        currentMessage: {
            message: '',
            loading: false
        },
        messages: {
            recent: {},
            featured: []
        }
    }

    constructor(props) {
        super(props);

        this.onMessageEdit = this.onMessageEdit.bind(this);
        this.onMessageSend = this.onMessageSend.bind(this);
        this.onMessageTip = this.onMessageTip.bind(this);
    }

    async componentDidMount() {
        await new Promise(resolve => {
            const tronWebState = {
                installed: !!window.tronWeb,
                loggedIn: window.tronWeb && window.tronWeb.ready
            };

            if(tronWebState.installed) {
                this.setState({
                    tronWeb:
                    tronWebState
                });

                return resolve();
            }

            let tries = 0;

            const timer = setInterval(() => {
                if(tries >= 10) {
                    const TRONGRID_API = 'https://api.trongrid.io';

                    window.tronWeb = new TronWeb(
                        TRONGRID_API,
                        TRONGRID_API,
                        TRONGRID_API
                    );

                    this.setState({
                        tronWeb: {
                            installed: false,
                            loggedIn: false
                        }
                    });

                    clearInterval(timer);
                    return resolve();
                }

                tronWebState.installed = !!window.tronWeb;
                tronWebState.loggedIn = window.tronWeb && window.tronWeb.ready;

                if(!tronWebState.installed)
                    return tries++;

                this.setState({
                    tronWeb: tronWebState
                });

                resolve();
            }, 100);
        });

        if(!this.state.tronWeb.loggedIn) {
            // Set default address (foundation address) used for contract calls
            // Directly overwrites the address object as TronLink disabled the
            // function call
            window.tronWeb.defaultAddress = {
                hex: window.tronWeb.address.toHex(FOUNDATION_ADDRESS),
                base58: FOUNDATION_ADDRESS
            };

            window.tronWeb.on('addressChanged', () => {
                if(this.state.tronWeb.loggedIn)
                    return;

                this.setState({
                    tronWeb: {
                        installed: true,
                        loggedIn: true
                    }
                });
            });
        }

        await Utils.setTronWeb(window.tronWeb);

        this.startEventListener();
        this.fetchMessages();
    }

    // Polls blockchain for smart contract events
    startEventListener() {
        Utils.contract.MessagePosted().watch((err, { result }) => {
            if(err)
                return console.error('Failed to bind event listener:', err);

            console.log('Detected new message:', result.id);
            this.fetchMessage(+result.id);
        });

        /*Utils.contract.MessageTipped().watch((err, { result }) => {
            if(err)
                return console.error('Failed to bind event listener:', err);

            console.log('Message was tipped:', result.id);
            this.fetchMessage(+result.id);
        });

        Utils.contract.MessageAddedToTopPosts().watch((err, { result }) => {
            if(err)
                return console.error('Failed to bind event listener:', err);

            console.log('Message was added to featured posts:', result.id);
            this.fetchMessage(+result.id);

            const {
                recent,
                featured
            } = this.state.messages;

            if(featured.includes(+result.id))
                return;

            this.setState({
                messages: {
                    recent: this.state.messages.recent,
                    featured: [ ...featured, +result.id ]
                }
            });
        });

        Utils.contract.MessageRemovedFromTopPosts().watch((err, { result }) => {
            if(err)
                return console.error('Failed to bind event listener:', err);

            console.log('Message was removed from featured posts:', result.id);
            this.fetchMessage(+result.id);

            const {
                recent,
                featured
            } = this.state.messages;

            if(!featured.includes(+result.id))
                return;

            this.setState({
                messages: {
                    recent: this.state.messages.recent,
                    featured: featured.filter(messageID => messageID !== +result.id)
                }
            });
        });*/
    }

    async fetchMessages() {
        this.setState({
            messages: await Utils.fetchMessages()
        });
    }

    async fetchMessage(messageID) {
        const {
            recent,
            featured,
            message
        } = await Utils.fetchMessage(messageID, this.state.messages);

        this.setState({
            messages: {
                recent,
                featured
            }
        });

        return message;
    }

    // Stores value of textarea to state
    onMessageEdit({ target: { value } }) {
        if(this.state.currentMessage.loading)
            return;

        this.setState({
            currentMessage: {
                message: value,
                loading: false
            }
        });
    }

    // Submits message to the blockchain
    onMessageSend() {
        const {
            loading,
            message
        } = this.state.currentMessage;

        if(loading)
            return;

        if(!message.trim().length)
            return;

        this.setState({
            currentMessage: {
                loading: true,
                message
            }
        });

        Utils.contract.postMessage(message).send({
            shouldPollResponse: true,
            callValue: 0
        }).then(res => Swal({
            title: 'Post Created',
            type: 'success'
        })).catch(err => Swal({
            title: 'Post Failed',
            type: 'error'
        })).then(() => {
            this.setState({
                currentMessage: {
                    loading: false,
                    message
                }
            });
        });
    }

    // Tips a message with a specific amount
    async onMessageTip(messageID) {
        const messages = {
            ...this.state.messages.recent,
            ...this.state.messages.featured
        };

        if(!messages.hasOwnProperty(messageID))
            return;

        if(!this.state.tronWeb.loggedIn)
            return;

        if(messages[messageID].owner === Utils.tronWeb.defaultAddress.base58)
            return;

        const { value } = await Swal({
            title: 'Tip Message',
            text: 'Enter tip amount in TRX',
            confirmButtonText: 'Tip',
            input: 'text',
            showCancelButton: true,
            showLoaderOnConfirm: true,
            reverseButtons: true,
            allowOutsideClick: () => !Swal.isLoading(),
            allowEscapeKey: () => !Swal.isLoading(),
            preConfirm: amount => {
                if(isNaN(amount) || amount <= 0) {
                    Swal.showValidationMessage('Invalid tip amount provided');
                    return false;
                }

                return Utils.contract.tipMessage(+messageID).send({
                    callValue: Number(amount) * 1000000
                }).then(() => true).catch(err => {
                    Swal.showValidationMessage(err);
                });
            }
        });

        value && Swal({
            title: 'Message Tipped',
            type: 'success'
        });
    }

    renderMessageInput() {
        if(!this.state.tronWeb.installed)
            return <TronLinkGuide />;

        if(!this.state.tronWeb.loggedIn)
            return <TronLinkGuide installed />;

        return (
            <div className={ 'messageInput' + (this.state.currentMessage.loading ? ' loading' : '') }>
                <textarea
                    placeholder='Enter your message to post'
                    value={ this.state.currentMessage.message }
                    onChange={ this.onMessageEdit }></textarea>
                <div className='footer'>
                    <div className='warning'>
                        Posting a message will cost 1 TRX and network fees
                    </div>
                    <div
                        className={ 'sendButton' + (!!this.state.currentMessage.message.trim().length ? '' : ' disabled') }
                        onClick={ this.onMessageSend }
                    >
                        Post Message
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const {
            recent,
            featured
        } = this.state.messages;

        const messages = Object.entries(recent).sort((a, b) => b[1].timestamp - a[1].timestamp).map(([ messageID, message ]) => (
            <Message
                message={ message }
                featured={ featured.includes(+messageID) }
                key={ messageID }
                messageID={ messageID }
                tippable={ message.owner !== Utils.tronWeb.defaultAddress.base58 }
                requiresTronLink={ !this.state.tronWeb.installed }
                onTip={ this.onMessageTip } />
        ));

        return (
            <div className='kontainer'>
                <div className='header white'>
                    <p>
                        <strong>Tron Message Board</strong> is a DApp which allows you to post messages
                        along with tipping others or receiving tips. There is no additional cost associated
                        when tipping people, however you do have to pay network fees.<br/><br/>

                        Want to build your own DApp? The code to this demo is available on&nbsp;
                        <a href='https://github.com/TronWatch/TronLink-Demo-Messages/' target='_blank' rel='noopener noreferrer'>
                            GitHub
                        </a>.
                    </p>
                </div>

                { this.renderMessageInput() }

                <div className='header'>
                    <h1>Featured</h1>
                    <span>The top 20 messages, sorted by the total tips</span>
                </div>
                <Featured
                    recent={ recent }
                    featured={ featured }
                    currentAddress={ Utils.tronWeb && Utils.tronWeb.defaultAddress.base58 }
                    tronLinkInstalled={ this.state.tronWeb.installed }
                    onTip={ this.onMessageTip } />

                <div className='header'>
                    <h1>Recent</h1>
                    <span>Click any message to send the user a tip</span>
                </div>
                <div className='messages'>
                    { messages }
                </div>
            </div>
        );
    }
}

export default App;
