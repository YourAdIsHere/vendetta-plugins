import React, { useState } from 'react';
import { ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";

export default () => {
    useProxy(storage);

    // Default values for encryption key
    var encryptionKey = encryptionKey || 'your-encryption-key';

    const [key, setKey] = useState(encryptionKey);

    return (
        <ReactNative.ScrollView>
            <Forms.FormTextInput
                label="Encryption Key"
                placeholder="Enter encryption key"
                value={key}
                onChangeText={value => {
                    setKey(value);
                    encryptionKey = value;
                }}
            />
        </ReactNative.ScrollView>
    );
};
