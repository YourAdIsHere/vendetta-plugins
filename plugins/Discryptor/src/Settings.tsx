import { ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";

export default () => {
    useProxy(storage);

    // Default values for encryption key
    var encryptionKey = encryptionKey || 'your-encryption-key';

    return (
        <ReactNative.ScrollView>
            <Forms.FormTextInput
                label="Encryption Key"
                placeholder="Enter encryption key"
                value={encryptionKey}
                onChangeText={value => {
                    encryptionKey = value;
                }}
            />
        </ReactNative.ScrollView>
    );
};
