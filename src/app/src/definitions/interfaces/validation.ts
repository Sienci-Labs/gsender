export interface SignInParams {
    token: string,
    name?: string,
    password?: string,
};

export interface ValidationProps {
    type: string,
    name: string
    checked: boolean
};

export interface ValidationComponent {
    blurred: boolean,
    changed: boolean,
    value: string,
};

export interface ValidationComponents {
    password: Array<ValidationComponent>,
    confirm: Array<ValidationComponent>,
};

export interface RequiredComponent {
    [key: string]: Array<{checked: boolean, props: ValidationProps}>
};