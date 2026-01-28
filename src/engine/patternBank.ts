/**
 * Pattern Bank - All regex patterns for detecting Kotlin/Java constructs
 */

/**
 * Kotlin interface detection patterns
 */
export const KotlinPatterns = {
    // Standard interface
    interface: /^\s*(?:public\s+)?interface\s+([A-Z]\w*)/,

    // Fun interface (SAM interface - Kotlin 1.4+)
    funInterface: /^\s*(?:public\s+)?fun\s+interface\s+([A-Z]\w*)/,

    // Sealed interface (Kotlin 1.5+)
    sealedInterface: /^\s*sealed\s+interface\s+([A-Z]\w*)/,

    // Abstract class
    abstractClass: /^\s*(?:public\s+)?(?:open\s+)?abstract\s+class\s+([A-Z]\w*)/,

    // Sealed class
    sealedClass: /^\s*sealed\s+class\s+([A-Z]\w*)/,

    // Value class (inline class - Kotlin 1.5+)
    valueClass: /^\s*(?:@JvmInline\s+)?value\s+class\s+([A-Z]\w*)/,

    // Enum class
    enumClass: /^\s*enum\s+class\s+([A-Z]\w*)/,

    // Class implementing interface (with optional generics, primary constructor, and supertype)
    classImplements: /class\s+([A-Z]\w*)(?:\s*<[^>]+>)?\s*(?:\([^)]*\))?\s*:\s*([A-Z]\w*(?:\s*<[^>]*>)?)/,

    // Data class implementing interface
    dataClassImplements: /data\s+class\s+([A-Z]\w*)(?:\s*<[^>]+>)?\s*\([^)]*\)\s*:\s*([A-Z]\w*)/,

    // Object implementing interface
    objectImplements: /object\s+([A-Z]\w*)\s*:\s*([A-Z]\w*)/,

    // Companion object implementing interface
    companionObjectImplements: /companion\s+object\s*:\s*([A-Z]\w*)/,

    // Delegation pattern (by keyword)
    delegation: /:\s*([A-Z]\w*)\s+by\s+/,

    // Method declaration (accepts both "override suspend" and "suspend override")
    method: /^\s*(?:(?:override|suspend)\s+)?(?:(?:override|suspend)\s+)?fun\s+([a-z_]\w*)\s*\(/,

    // Abstract method
    abstractMethod: /^\s*abstract\s+fun\s+([a-z_]\w*)\s*\(/,

    // Override method
    overrideMethod: /^\s*override\s+fun\s+([a-z_]\w*)\s*\(/,

    // Suspend function
    suspendFunction: /^\s*(?:override\s+)?suspend\s+fun\s+([a-z_]\w*)\s*\(/,

    // Spring Boot annotations
    springAnnotations: /@(Component|Service|Repository|Controller|RestController|Bean|Configuration)\s*(?:\([^)]*\))?/,

    // All annotations (for filtering)
    anyAnnotation: /@([A-Z]\w*)\s*(?:\([^)]*\))?/
};

/**
 * Java interface detection patterns
 */
export const JavaPatterns = {
    // Standard interface
    interface: /^\s*(?:public\s+)?(?:static\s+)?interface\s+([A-Z]\w*)/,

    // Abstract class
    abstractClass: /^\s*(?:public\s+)?abstract\s+class\s+([A-Z]\w*)/,

    // Record (Java 14+)
    record: /^\s*(?:public\s+)?record\s+([A-Z]\w*)/,

    // Enum
    enum: /^\s*(?:public\s+)?enum\s+([A-Z]\w*)/,

    // Class implementing interface
    classImplements: /class\s+([A-Z]\w*)(?:\s*<[^>]+>)?\s+implements\s+([A-Z]\w*(?:\s*<[^>]*>)?)/,

    // Class extending abstract class
    classExtends: /class\s+([A-Z]\w*)(?:\s*<[^>]+>)?\s+extends\s+([A-Z]\w*)/,

    // Class with both extends and implements
    classExtendsImplements: /class\s+([A-Z]\w*)(?:\s*<[^>]+>)?\s+extends\s+[A-Z]\w*\s+implements\s+([A-Z]\w*(?:\s*,\s*[A-Z]\w*)*)/,

    // Method declaration (with return type)
    method: /^\s*(?:public\s+)?(?:protected\s+)?(?:private\s+)?(?:[\w<>.*[\]]+\s+)?([a-z_]\w*)\s*\(/,

    // Abstract method
    abstractMethod: /^\s*(?:public\s+)?(?:protected\s+)?abstract\s+[\w<>.*[\]]+\s+([a-z_]\w*)\s*\(/,

    // Override annotation followed by method
    overrideMethod: /@Override\s+(?:public\s+)?(?:[\w<>.*[\]]+\s+)?([a-z_]\w*)\s*\(/,

    // Default method (Java 8+)
    defaultMethod: /^\s*(?:public\s+)?default\s+[\w<>.*[\]]+\s+([a-z_]\w*)\s*\(/,

    // Spring Boot annotations
    springAnnotations: /@(Component|Service|Repository|Controller|RestController|Bean|Configuration)\s*(?:\([^)]*\))?/,

    // All annotations
    anyAnnotation: /@([A-Z]\w*)\s*(?:\([^)]*\))?/
};

/**
 * Common patterns for both languages
 */
export const CommonPatterns = {
    // Package declaration
    package: /^\s*package\s+([\w.]+)/,

    // Import statement
    import: /^\s*import\s+([\w.*]+)/,

    // Generic type parameters
    generics: /<([^>]+)>/,

    // Method parameters
    parameters: /\(([^)]*)\)/,

    // Line comment
    lineComment: /^\s*\/\//,

    // Block comment start
    blockCommentStart: /\/\*/,

    // Block comment end
    blockCommentEnd: /\*\//,

    // Multiple interface implementation (comma-separated)
    multipleInterfaces: /([A-Z]\w*)(?:\s*,\s*([A-Z]\w*))*/
};

/**
 * File path patterns for filtering
 */
export const PathPatterns = {
    // Test directories
    testDirs: [
        /\/test[s]?\//,
        /\/androidTest\//,
        /\/commonTest\//,
        /\/jvmTest\//,
        /\/iosTest\//
    ],

    // Mock/stub directories
    mockDirs: [
        /\/mocks?\//,
        /\/doubles\//,
        /\/fakes\//,
        /\/stubs?\//
    ],

    // Build output directories
    buildDirs: [
        /\/build\//,
        /\/target\//,
        /\/out\//,
        /\/\.gradle\//
    ],

    // Test file suffixes
    testFiles: [
        /_test\./,
        /_spec\./,
        /Test\./,
        /Spec\./,
        /Tests\./
    ],

    // Mock file suffixes
    mockFiles: [
        /_mock\./,
        /_stub\./,
        /_fake\./,
        /Mock\./,
        /Stub\./,
        /Fake\./
    ]
};

/**
 * Type name patterns for filtering
 */
export const TypeNamePatterns = {
    // Mock types
    mocks: [
        /^Mock\w+/,      // MockUserRepository
        /\w+Mock$/,      // UserRepositoryMock
        /^Fake\w+/,      // FakeUserRepository
        /\w+Fake$/,      // UserRepositoryFake
        /^Stub\w+/,      // StubUserRepository
        /\w+Stub$/,      // UserRepositoryStub
        /^Test\w+/,      // TestUserRepository
        /\w+Test$/,      // UserRepositoryTest
        /^_\w+/          // _InternalTest
    ]
};

/**
 * Annotation patterns for filtering
 */
export const AnnotationPatterns = {
    // Test annotations (exclude these)
    testAnnotations: [
        '@Test',
        '@Mock',
        '@InjectMocks',
        '@MockBean',
        '@ExtendWith',
        '@BeforeEach',
        '@AfterEach',
        '@Spy'
    ],

    // Spring annotations (highlight these)
    springAnnotations: [
        '@Component',
        '@Service',
        '@Repository',
        '@Controller',
        '@RestController',
        '@Bean',
        '@Configuration'
    ]
};

/**
 * Helper function to extract interface name from a line
 */
export function extractInterfaceName(line: string, language: 'kotlin' | 'java'): string | null {
    const patterns = language === 'kotlin' ? KotlinPatterns : JavaPatterns;

    // Try regular interface
    let match = line.match(patterns.interface);
    if (match) return match[1];

    // Try fun interface (SAM interface - Kotlin only)
    if (language === 'kotlin') {
        match = line.match(KotlinPatterns.funInterface);
        if (match) return match[1];
    }

    // Try sealed interface (Kotlin only)
    if (language === 'kotlin') {
        match = line.match(KotlinPatterns.sealedInterface);
        if (match) return match[1];
    }

    // Try abstract class
    match = line.match(patterns.abstractClass);
    if (match) return match[1];

    // Try sealed class (Kotlin only)
    if (language === 'kotlin') {
        match = line.match(KotlinPatterns.sealedClass);
        if (match) return match[1];

        // Try value class (inline class)
        match = line.match(KotlinPatterns.valueClass);
        if (match) return match[1];

        // Try enum class
        match = line.match(KotlinPatterns.enumClass);
        if (match) return match[1];
    }

    // Try record (Java only)
    if (language === 'java') {
        match = line.match(JavaPatterns.record);
        if (match) return match[1];

        // Try enum
        match = line.match(JavaPatterns.enum);
        if (match) return match[1];
    }

    return null;
}

/**
 * Helper function to extract class and interface names from implementation line
 */
export function extractImplementation(line: string, language: 'kotlin' | 'java'): { className: string; interfaceName: string } | null {
    const patterns = language === 'kotlin' ? KotlinPatterns : JavaPatterns;

    // Try data class (Kotlin only)
    if (language === 'kotlin') {
        let match = line.match(KotlinPatterns.dataClassImplements);
        if (match) return { className: match[1], interfaceName: match[2] };

        // Try delegation
        match = line.match(KotlinPatterns.delegation);
        if (match) return { className: '', interfaceName: match[1] };
    }

    // Try regular class implements
    let match = line.match(patterns.classImplements);
    if (match) return { className: match[1], interfaceName: match[2] };

    // Try extends (Java)
    if (language === 'java') {
        match = line.match(JavaPatterns.classExtends);
        if (match) return { className: match[1], interfaceName: match[2] };
    }

    return null;
}

/**
 * Helper function to extract method name from a line
 */
export function extractMethodName(line: string, language: 'kotlin' | 'java'): string | null {
    const patterns = language === 'kotlin' ? KotlinPatterns : JavaPatterns;

    // Try override method first
    let match = line.match(patterns.overrideMethod);
    if (match) return match[1];

    // Try abstract method
    match = line.match(patterns.abstractMethod);
    if (match) return match[1];

    // Try regular method
    match = line.match(patterns.method);
    if (match) return match[1];

    return null;
}

/**
 * Helper function to extract annotations from a line
 */
export function extractAnnotations(line: string): string[] {
    const annotations: string[] = [];
    const kotlinMatch = line.match(KotlinPatterns.springAnnotations);
    const javaMatch = line.match(JavaPatterns.springAnnotations);

    if (kotlinMatch) annotations.push(kotlinMatch[1]);
    if (javaMatch) annotations.push(javaMatch[1]);

    return annotations;
}

/**
 * Helper function to check if a line is in a comment
 */
export function isCommentLine(line: string): boolean {
    return CommonPatterns.lineComment.test(line);
}

/**
 * Helper function to get all interface/abstract patterns for a language
 */
export function getInterfacePatterns(language: 'kotlin' | 'java'): RegExp[] {
    if (language === 'kotlin') {
        return [
            KotlinPatterns.interface,
            KotlinPatterns.funInterface,
            KotlinPatterns.sealedInterface,
            KotlinPatterns.abstractClass,
            KotlinPatterns.sealedClass,
            KotlinPatterns.valueClass,
            KotlinPatterns.enumClass
        ];
    } else {
        return [
            JavaPatterns.interface,
            JavaPatterns.abstractClass,
            JavaPatterns.record,
            JavaPatterns.enum
        ];
    }
}

/**
 * Helper function to get all implementation patterns for a language
 */
export function getImplementationPatterns(language: 'kotlin' | 'java'): RegExp[] {
    if (language === 'kotlin') {
        return [
            KotlinPatterns.classImplements,
            KotlinPatterns.dataClassImplements,
            KotlinPatterns.objectImplements,
            KotlinPatterns.delegation
        ];
    } else {
        return [
            JavaPatterns.classImplements,
            JavaPatterns.classExtends,
            JavaPatterns.classExtendsImplements
        ];
    }
}
