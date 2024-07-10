import { React } from "@vendetta/metro/common";
import { ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";

export default () => {
    useProxy(storage);

    // Default values for encryption key
    storage.encryptionKey ??= 'default-encryption-key';

    const [key, setKey] = React.useState(storage.encryptionKey);

    return (
        <ReactNative.ScrollView>
            <Forms.FormTextInput
                label="Encryption Key"
                placeholder="Enter encryption key"
                value={key}
                onChangeText={value => {
                    setKey(value);
                    storage.encryptionKey = value;
                }}
            />
        </ReactNative.ScrollView>
    );
};
