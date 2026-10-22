import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'orange' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  testID,
}: ButtonProps) {
  const getContainerStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.full,
      opacity: disabled ? 0.6 : pressed ? 0.88 : 1,
      transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
    };

    let variantStyle: ViewStyle = {};
    if (variant === 'primary') {
      variantStyle = {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
      };
    } else if (variant === 'orange') {
      variantStyle = {
        backgroundColor: Colors.coachOrange,
        shadowColor: Colors.coachOrange,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
      };
    } else if (variant === 'secondary') {
      variantStyle = {
        backgroundColor: Colors.canvasBase,
        borderWidth: 1,
        borderColor: Colors.border,
      };
    } else if (variant === 'danger') {
      variantStyle = {
        backgroundColor: Colors.error,
      };
    } else if (variant === 'ghost') {
      variantStyle = {
        backgroundColor: 'transparent',
      };
    }

    let sizeStyle: ViewStyle = {};
    if (size === 'sm') {
      sizeStyle = { height: 38, paddingHorizontal: Spacing.md, gap: 6 };
    } else if (size === 'lg') {
      sizeStyle = { height: 54, paddingHorizontal: Spacing.xl, gap: 10 };
    } else {
      sizeStyle = { height: 48, paddingHorizontal: Spacing.base, gap: 8 };
    }

    return [base, variantStyle, sizeStyle, style];
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    let color: string = Colors.onPrimary;
    if (variant === 'secondary') color = Colors.charcoalDark;
    else if (variant === 'ghost') color = Colors.primary;

    const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 15;
    return [{ color, fontSize, fontWeight: '700', letterSpacing: 0.2 }, textStyle];
  };

  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => getContainerStyle(pressed)}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? Colors.charcoalDark : '#FFF'}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
