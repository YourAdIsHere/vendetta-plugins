import React, { useState } from 'react';
import { ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
export default () => {
    useProxy(storage);
    // Default values for encryption key
    storage.encryptionKey ??= 'your-encryption-key';
    const [key, setKey] = useState(storage.encryptionKey);
    return (<ReactNative.ScrollView>
            <Forms.FormSwitchRow label="Split messages on words instead of newlines" subLabel="Results in the lowest amount of messages" onValueChange={(v) => storage.splitOnWords = v} value={storage.splitOnWords}/>
            <Forms.FormTextInput label="Encryption Key" placeholder="Enter encryption key" value={key} onChangeText={value => {
            setKey(value);
            storage.encryptionKey = value;
        }}/>
        </ReactNative.ScrollView>);
};
