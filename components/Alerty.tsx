import { Alert, Platform } from 'react-native'

const alertPolyfill = (
    title: string,
    description: string,
    options?: Array<{
        text: string,
        onPress: () => void,
        style?: string
    }>) => {
    if (!options) {
        window.alert([title, description].filter(Boolean).join('\n'))
        return;
    }
    const result = window.confirm([title, description].filter(Boolean).join('\n'))

    if (result) {
        const confirmOption = options.find(({ style }) => style !== 'cancel')
        confirmOption && confirmOption.onPress()
    } else {
        const cancelOption = options.find(({ style }) => style === 'cancel')
        cancelOption && cancelOption.onPress()
    }
}

const Alerty = Platform.OS === 'web' ? alertPolyfill : Alert.alert

export default Alerty

