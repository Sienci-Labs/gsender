import { createContext, useContext, ReactNode, useState } from 'react';

type Point = {
    id: number;
    position: 'bottom-left' | 'bottom-right' | 'top';
    label: string;
    show: boolean;
    isActive?: boolean;
};

type Arrow = {
    id: number;
    position: 'bottom' | 'right' | 'diagonal';
    label: string | ReactNode;
    hasTop: boolean;
    hasBottom: boolean;
    show: boolean;
    isActive?: boolean;
};

type Shapes = {
    circlePoints: Point[];
    arrows: Arrow[];
};

type Triangle = {
    a: number;
    b: number;
    c: number;
};

type JogValues = {
    x: number;
    y: number;
    z: number;
};

type SubStep = {
    buttonLabel: string;
    description: string;
    completed: boolean;
    value?: number;
    output?: React.ReactNode;
    shapeActions?: Array<{
        shapeType: keyof Shapes;
        shapeID: number;
        isActive: boolean;
        show: boolean;
        clearPrevious?: boolean;
        label: string | ReactNode;
    }>;
};

type MainStep = {
    title: string;
    description: string;
    subSteps: SubStep[];
};

export type SquaringContextType = {
    mainSteps: MainStep[];
    currentMainStep: number;
    currentSubStep: number;
    triangle: Triangle;
    jogValues: JogValues;
    shapes: Shapes;
    completeStep: (buttonLabel: string) => void;
    updateTriangle: (side: keyof Triangle, value: number) => void;
    updateStepValue: (buttonLabel: string, value: number) => void;
    jogMachine: (axis: string, value: number) => void;
    goToNextMainStep: () => void;
    goToPreviousMainStep: () => void;
    resetSquaring: () => void;
    isStepEnabled: (mainStepIndex: number, subStepIndex: number) => boolean;
    canGoToNextMainStep: () => boolean;
};

const initialShapes: Shapes = {
    circlePoints: [
        { id: 0, position: 'bottom-left', label: '1', show: false },
        { id: 1, position: 'bottom-right', label: '2', show: false },
        { id: 2, position: 'top', label: '3', show: false },
    ],
    arrows: [
        {
            id: 0,
            position: 'bottom',
            label: '',
            hasTop: true,
            hasBottom: false,
            show: false,
        },
        {
            id: 1,
            position: 'right',
            label: '',
            hasTop: true,
            hasBottom: false,
            show: false,
        },
        {
            id: 2,
            position: 'diagonal',
            label: '',
            hasTop: true,
            hasBottom: true,
            show: false,
        },
    ],
};

const initialMainSteps: MainStep[] = [
    {
        title: 'Mark Reference Points',
        description:
            "First, we'll mark three points on your machine in a triangle.",
        subSteps: [
            {
                buttonLabel: 'Mark Point 1',
                description:
                    'Stick the first tape to the wasteboard at the CNCs current position. The pointed tip should almost be touching the center of the X.',
                completed: false,
                output: null,
                shapeActions: [
                    {
                        shapeType: 'circlePoints',
                        shapeID: 0,
                        isActive: true,
                        show: true,
                        clearPrevious: true,
                        label: '1',
                    },
                ],
            },
            {
                buttonLabel: 'Move X-axis',
                description: 'Input the farthest your CNC can move in the X-axis to create a horizontal line.',
                value: 300,
                completed: false,
                output: null,
                shapeActions: [
                    {
                        shapeType: 'circlePoints',
                        shapeID: 0,
                        isActive: false,
                        show: true,
                        clearPrevious: false,
                        label: '1',
                    },
                    {
                        shapeType: 'arrows',
                        shapeID: 0,
                        isActive: true,
                        show: true,
                        clearPrevious: true,
                        label: 'X',
                    },
                ],
            },
            {
                buttonLabel: 'Mark Point 2',
                description:
                    'Now mark the second location with the second piece of tape.',
                completed: false,
                output: null,
                shapeActions: [
                    {
                        shapeType: 'circlePoints',
                        shapeID: 0,
                        isActive: false,
                        show: true,
                        clearPrevious: true,
                        label: '1',
                    },
                    {
                        shapeType: 'circlePoints',
                        shapeID: 1,
                        isActive: true,
                        show: true,
                        clearPrevious: false,
                        label: '2',
                    },
                ],
            },
            {
                buttonLabel: 'Move Y-axis',
                description: 'Input the farthest your CNC can move in the Y-axis to create a vertical line.',
                value: 300,
                completed: false,
                output: null,
                shapeActions: [
                    {
                        shapeType: 'circlePoints',
                        shapeID: 0,
                        isActive: false,
                        show: true,
                        clearPrevious: true,
                        label: '1',
                    },
                    {
                        shapeType: 'circlePoints',
                        shapeID: 1,
                        isActive: false,
                        show: true,
                        clearPrevious: false,
                        label: '2',
                    },
                    {
                        shapeType: 'arrows',
                        shapeID: 1,
                        isActive: true,
                        show: true,
                        clearPrevious: false,
                        label: 'Y',
                    },
                ],
            },
            {
                buttonLabel: 'Mark Point 3',
                description:
                    'Place the last piece of tape with an X mark at the current position.',
                completed: false,
                output: null,
                shapeActions: [
                    {
                        shapeType: 'circlePoints',
                        shapeID: 0,
                        isActive: false,
                        show: true,
                        clearPrevious: true,
                        label: '1',
                    },
                    {
                        shapeType: 'circlePoints',
                        shapeID: 1,
                        isActive: false,
                        show: true,
                        clearPrevious: false,
                        label: '2',
                    },
                    {
                        shapeType: 'circlePoints',
                        shapeID: 2,
                        isActive: true,
                        show: true,
                        clearPrevious: false,
                        label: '3',
                    },
                ],
            },
        ],
    },
    {
        title: 'Take Measurements',
        description:
            "Now, measure the distances between the points you've marked and enter them below.",
        subSteps: [
            {
                buttonLabel: 'Measure Distance 1-2',
                description: 'Measure the distance between points 1 and 2.',
                completed: false,
                output: null,
            },
            {
                buttonLabel: 'Measure Distance 2-3',
                description: 'Measure the distance between points 2 and 3.',
                completed: false,
                output: null,
            },
            {
                buttonLabel: 'Measure Distance 1-3',
                description: 'Measure the distance between points 1 and 3.',
                completed: false,
                output: null,
            },
        ],
    },
    {
        title: 'Results',
        description: 'Review the results and get adjustment recommendations.',
        subSteps: [
            {
                buttonLabel: 'View Results',
                description: 'View the squaring results and recommendations.',
                completed: false,
                output: null,
            },
        ],
    },
];

const SquaringContext = createContext<SquaringContextType | undefined>(
    undefined,
);

export const SquaringProvider = ({ children }: { children: ReactNode }) => {
    const [triangle, setTriangle] = useState<Triangle>({ a: 0, b: 0, c: 0 });
    const [shapes, setShapes] = useState<Shapes>(initialShapes);
    const [jogValues, setJogValues] = useState<JogValues>({ x: 0, y: 0, z: 0 });
    const [currentMainStep, setCurrentMainStep] = useState(0);
    const [currentSubStep, setCurrentSubStep] = useState(0);
    const [mainSteps, setMainSteps] = useState<MainStep[]>(initialMainSteps);

    const isStepEnabled = (mainStepIndex: number, subStepIndex: number) => {
        // If it's a previous main step, it's always enabled
        if (mainStepIndex < currentMainStep) return true;

        // If it's a future main step, it's always disabled
        if (mainStepIndex > currentMainStep) return false;

        // For the current main step, check if all previous sub-steps are completed
        const currentMainStepData = mainSteps[mainStepIndex];

        // If it's the first sub-step of any main step, it's always enabled
        if (subStepIndex === 0) return true;

        // For other sub-steps, check if all previous sub-steps are completed
        for (let i = 0; i < subStepIndex; i++) {
            if (!currentMainStepData.subSteps[i].completed) {
                return false;
            }
        }
        return true;
    };

    const canGoToNextMainStep = () => {
        const currentMainStepData = mainSteps[currentMainStep];
        return currentMainStepData.subSteps.every((step) => step.completed);
    };

    const completeStep = (buttonLabel: string) => {
        setMainSteps((prevMainSteps) => {
            const updatedMainSteps = [...prevMainSteps];
            const currentMainStepData = updatedMainSteps[currentMainStep];

            // Only allow completing a step if all previous steps are completed
            const stepIndex = currentMainStepData.subSteps.findIndex(
                (step) => step.buttonLabel === buttonLabel,
            );

            // If the step is not enabled, return the previous state unchanged
            if (!isStepEnabled(currentMainStep, stepIndex)) {
                return prevMainSteps;
            }

            // Update the completed status of the current step
            currentMainStepData.subSteps = currentMainStepData.subSteps.map(
                (step) =>
                    step.buttonLabel === buttonLabel
                        ? { ...step, completed: true }
                        : step,
            );

            // Move to next incomplete sub-step if there is one
            const nextIncompleteIndex = currentMainStepData.subSteps.findIndex(
                (step) => !step.completed,
            );
            if (nextIncompleteIndex !== -1) {
                setCurrentSubStep(nextIncompleteIndex);
            }

            return updatedMainSteps;
        });

        // Update shapes based on the step's shapeActions
        const step = mainSteps[currentMainStep].subSteps.find(
            (s) => s.buttonLabel === buttonLabel,
        );
        if (step?.shapeActions) {
            setShapes((prevShapes) => {
                const updatedShapes = { ...prevShapes };
                step.shapeActions?.forEach((action) => {
                    if (action.clearPrevious) {
                        if (action.shapeType === 'circlePoints') {
                            updatedShapes.circlePoints =
                                updatedShapes.circlePoints.map((shape) => ({
                                    ...shape,
                                    isActive:
                                        shape.id === action.shapeID
                                            ? action.isActive
                                            : false,
                                    show:
                                        shape.id === action.shapeID
                                            ? action.show
                                            : false,
                                }));
                        } else if (action.shapeType === 'arrows') {
                            updatedShapes.arrows = updatedShapes.arrows.map(
                                (shape) => ({
                                    ...shape,
                                    isActive:
                                        shape.id === action.shapeID
                                            ? action.isActive
                                            : false,
                                    show:
                                        shape.id === action.shapeID
                                            ? action.show
                                            : false,
                                }),
                            );
                        }
                    } else {
                        if (action.shapeType === 'circlePoints') {
                            updatedShapes.circlePoints =
                                updatedShapes.circlePoints.map((shape) =>
                                    shape.id === action.shapeID
                                        ? {
                                              ...shape,
                                              isActive: action.isActive,
                                              show: action.show,
                                          }
                                        : shape,
                                );
                        } else if (action.shapeType === 'arrows') {
                            updatedShapes.arrows = updatedShapes.arrows.map(
                                (shape) =>
                                    shape.id === action.shapeID
                                        ? {
                                              ...shape,
                                              isActive: action.isActive,
                                              show: action.show,
                                          }
                                        : shape,
                            );
                        }
                    }
                });
                return updatedShapes;
            });
        }
    };

    const updateStepValue = (buttonLabel: string, value: number) => {
        setMainSteps((prevMainSteps) => {
            const updatedMainSteps = [...prevMainSteps];
            const currentMainStepData = updatedMainSteps[currentMainStep];

            // Find the step index
            const stepIndex = currentMainStepData.subSteps.findIndex(
                (step) => step.buttonLabel === buttonLabel,
            );

            // Only allow updating if the step is enabled
            if (!isStepEnabled(currentMainStep, stepIndex)) {
                return prevMainSteps;
            }

            currentMainStepData.subSteps = currentMainStepData.subSteps.map(
                (step) =>
                    step.buttonLabel === buttonLabel
                        ? { ...step, value }
                        : step,
            );
            return updatedMainSteps;
        });
    };

    const updateTriangle = (id: keyof Triangle, value: number) => {
        setTriangle((prev) => ({ ...prev, [id]: value }));
    };

    const jogMachine = async (axis: string, value: number) => {
        // TODO: Implement machine control
        console.log(`Jogging ${axis} by ${value}mm`);
    };

    const goToNextMainStep = () => {
        if (currentMainStep < mainSteps.length - 1) {
            setCurrentMainStep((prev) => prev + 1);
            setCurrentSubStep(0);
        }
    };

    const goToPreviousMainStep = () => {
        if (currentMainStep > 0) {
            setCurrentMainStep((prev) => prev - 1);
            setCurrentSubStep(0);
        }
    };

    const resetSquaring = () => {
        // Create deep copies of initial states to ensure a fresh start
        const freshMainSteps = JSON.parse(JSON.stringify(initialMainSteps));
        const freshShapes = JSON.parse(JSON.stringify(initialShapes));

        // Reset all states
        setMainSteps(freshMainSteps);
        setCurrentMainStep(0);
        setCurrentSubStep(0);
        setTriangle({ a: 0, b: 0, c: 0 });
        setShapes(freshShapes);
        setJogValues({ x: 0, y: 0, z: 0 });
    };

    return (
        <SquaringContext.Provider
            value={{
                mainSteps,
                currentMainStep,
                currentSubStep,
                triangle,
                jogValues,
                shapes,
                completeStep,
                updateTriangle,
                updateStepValue,
                jogMachine,
                goToNextMainStep,
                goToPreviousMainStep,
                resetSquaring,
                isStepEnabled,
                canGoToNextMainStep,
            }}
        >
            {children}
        </SquaringContext.Provider>
    );
};

export const useSquaring = () => {
    const context = useContext(SquaringContext);
    if (context === undefined) {
        throw new Error('useSquaring must be used within a SquaringProvider');
    }
    return context;
};
