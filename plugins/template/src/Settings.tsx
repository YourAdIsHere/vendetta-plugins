import React from 'react';
import { Form, FormItem, TextInput, Switch, List } from '@vendetta/ui/components';
import { findByProps } from '@vendetta/metro';

export default {
    encryptionKey: 'your-encryption-key', // Default key
    encryptedChannels: [] as string[], // Array to store IDs of channels to encrypt

    render() {
        const { encryptedChannels } = this;

        return (
            <Form>
                <FormItem title="Encryption Key" description="Set the key for Blowfish encryption.">
                    <TextInput
                        placeholder="Enter encryption key"
                        defaultValue={this.encryptionKey}
                        onChange={value => {
                            this.encryptionKey = value;
                        }}
                    />
                </FormItem>
                <FormItem title="Select Channels for Encryption" description="Choose which channels to apply encryption to.">
                    <List
                        items={this.getChannelList()} // Get a list of channels to display
                        renderItem={(channel) => (
                            <Switch
                                checked={encryptedChannels.includes(channel.id)}
                                onChange={() => this.toggleChannelEncryption(channel.id)}
                                title={channel.name}
                            />
                        )}
                    />
                </FormItem>
            </Form>
        );
    },

    // Get a list of all channels
    getChannelList(): { id: string, name: string }[] {
        const ChannelStore = findByProps('getChannel');
        return Object.values(ChannelStore.getAllChannels()).map(channel => ({
            id: channel.id,
            name: channel.name,
        }));
    },

    // Toggle channel encryption state
    toggleChannelEncryption(channelId: string) {
        const index = this.encryptedChannels.indexOf(channelId);
        if (index > -1) {
            this.encryptedChannels.splice(index, 1); // Remove from the list
        } else {
            this.encryptedChannels.push(channelId); // Add to the list
        }
    }
};
