import React, { useState, useEffect } from 'react';
import { Text, useInput, Box } from 'ink';

export type AuthMethod = 'mobile' | 'web';

interface AuthSelectorProps {
    onSelect: (method: AuthMethod) => void;
    onCancel: () => void;
    supportsWebAuth: boolean;
}

export const AuthSelector: React.FC<AuthSelectorProps> = ({ onSelect, onCancel, supportsWebAuth }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    const options: Array<{ 
        method: AuthMethod; 
        label: string; 
    }> = [
        {
            method: 'mobile',
            label: 'Mobile App'
        }
    ];

    if (supportsWebAuth) {
        options.push({
            method: 'web',
            label: 'Web Browser'
        });
    }

    useEffect(() => {
        if (selectedIndex >= options.length) {
            setSelectedIndex(options.length - 1);
        }
    }, [options.length, selectedIndex]);

    useInput((input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(options.length - 1, prev + 1));
        } else if (key.return) {
            onSelect(options[selectedIndex].method);
        } else if (key.escape || (key.ctrl && input === 'c')) {
            onCancel();
        } else if (input === '1') {
            setSelectedIndex(0);
            onSelect('mobile');
        } else if (input === '2' && supportsWebAuth) {
            setSelectedIndex(1);
            onSelect('web');
        }
    });

    return (
        <Box flexDirection="column" paddingY={1}>
            <Box marginBottom={1}>
                <Text>How would you like to authenticate?</Text>
            </Box>

            <Box flexDirection="column">
                {options.map((option, index) => {
                    const isSelected = selectedIndex === index;
                    
                    return (
                        <Box key={option.method} marginY={0}>
                            <Text color={isSelected ? "cyan" : "gray"}>
                                {isSelected ? '› ' : '  '}
                                {index + 1}. {option.label}
                            </Text>
                        </Box>
                    );
                })}
            </Box>

            <Box marginTop={1}>
                <Text dimColor>
                    {supportsWebAuth ? 'Use arrows or 1-2 to select, Enter to confirm' : 'Press Enter to confirm'}
                </Text>
            </Box>
        </Box>
    );
};
