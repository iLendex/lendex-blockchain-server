
export const fetchSourceFile = async (): Promise<string> => {
  try {
    // Fetch the file content from the given URL
    const response = await fetch('https://raw.githubusercontent.com/Ghost-Capital/lendex-catalyst/main/scripts/source.js');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // The content of the source file as a string
    const sourceContent = await response.text();
    
    console.log('Source file content:', sourceContent);
    
    return sourceContent;
  } catch (error) {
    console.error('Error fetching the source file:', error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
};