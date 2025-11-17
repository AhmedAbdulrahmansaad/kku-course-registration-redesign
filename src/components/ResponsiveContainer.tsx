import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4 py-2 sm:py-4',
    md: 'px-3 sm:px-6 py-4 sm:py-6',
    lg: 'px-4 sm:px-8 py-6 sm:py-8',
  };

  return (
    <div 
      className={`w-full mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'md',
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 md:gap-6',
    lg: 'gap-4 sm:gap-6 md:gap-8',
    xl: 'gap-6 sm:gap-8 md:gap-10',
  };

  const getGridCols = () => {
    const classes = [];
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    return classes.join(' ');
  };

  return (
    <div className={`grid ${getGridCols()} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = true,
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div 
      className={`
        bg-card rounded-lg border shadow-sm
        ${paddingClasses[padding]}
        ${hover ? 'hover-lift transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Responsive Flex Component
interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    default?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  className = '',
  direction = { default: 'col', md: 'row' },
  gap = 'md',
  align = 'start',
  justify = 'start',
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 md:gap-6',
    lg: 'gap-4 sm:gap-6 md:gap-8',
    xl: 'gap-6 sm:gap-8 md:gap-10',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const getFlexDirection = () => {
    const classes = [];
    if (direction.default === 'row') classes.push('flex-row');
    else classes.push('flex-col');
    if (direction.sm === 'row') classes.push('sm:flex-row');
    else if (direction.sm === 'col') classes.push('sm:flex-col');
    if (direction.md === 'row') classes.push('md:flex-row');
    else if (direction.md === 'col') classes.push('md:flex-col');
    if (direction.lg === 'row') classes.push('lg:flex-row');
    else if (direction.lg === 'col') classes.push('lg:flex-col');
    return classes.join(' ');
  };

  return (
    <div 
      className={`
        flex ${getFlexDirection()}
        ${gapClasses[gap]}
        ${alignClasses[align]}
        ${justifyClasses[justify]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Responsive Typography Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  as: Component = 'p',
  className = '',
  size = 'base',
  weight = 'normal',
}) => {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl md:text-5xl',
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <Component className={`${sizeClasses[size]} ${weightClasses[weight]} ${className}`}>
      {children}
    </Component>
  );
};

// Responsive Section Component
interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  containerWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveSection: React.FC<ResponsiveSectionProps> = ({
  children,
  className = '',
  containerWidth = 'xl',
  spacing = 'md',
}) => {
  const spacingClasses = {
    none: 'py-0',
    sm: 'py-4 sm:py-6',
    md: 'py-6 sm:py-8 md:py-12',
    lg: 'py-8 sm:py-12 md:py-16',
    xl: 'py-12 sm:py-16 md:py-24',
  };

  return (
    <section className={`${spacingClasses[spacing]} ${className}`}>
      <ResponsiveContainer maxWidth={containerWidth}>
        {children}
      </ResponsiveContainer>
    </section>
  );
};
