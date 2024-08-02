export interface WidgetContext {
    widgetId: string,
    actions: {
        get: (key: string, defaultValue: any) => void,
        set: (key: string, value: any) => boolean ,
        unset: (key: string) => boolean
        replace: (key: string, value: any) => boolean 
    }
}