/**
 * Utility for splitting raw HTML content into distinct A4 pages.
 * It mounts an off-screen container matching the exact preview dimensions,
 * iterates through the DOM nodes, and calculates where page breaks should occur.
 */

export const paginateHtmlContent = async (
  htmlContent: string,
  fontFamily: string,
  firstPageMaxHeight: number = 600, // Accounting for Letterhead, Title, Date
  standardMaxHeight: number = 900   // Standard page without huge headers
): Promise<string[]> => {
  if (typeof window === 'undefined') return [htmlContent];

  return new Promise((resolve) => {
    // 1. Create the off-screen measuring container
    const measureContainer = document.createElement('div');
    // Match the exact typography and padding of LivePreview
    measureContainer.className = 'hr-document-content max-w-none text-slate-800';
    measureContainer.style.fontFamily = fontFamily;
    measureContainer.style.fontSize = '12pt';
    measureContainer.style.fontWeight = '400';
    measureContainer.style.lineHeight = '1.25';
    measureContainer.style.letterSpacing = '0px';
    measureContainer.style.wordSpacing = 'normal';
    measureContainer.style.textAlign = 'justify';
    // 794px total width minus 128px (px-16 is 64px on each side)
    measureContainer.style.width = '666px';
    measureContainer.style.position = 'absolute';
    measureContainer.style.visibility = 'hidden';
    measureContainer.style.top = '-9999px';
    document.body.appendChild(measureContainer);

    // 2. Load the content into a temporary virtual container
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent;
    const nodes = Array.from(tempContainer.childNodes);

    const pages: string[] = [];
    let currentPage = document.createElement('div');
    measureContainer.appendChild(currentPage);

    // 3. Process each top-level node
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i].cloneNode(true) as HTMLElement;
      
      // Attempt to append the entire node
      currentPage.appendChild(node);

      const currentMaxHeight = pages.length === 0 ? firstPageMaxHeight : standardMaxHeight;

      // 4. Check for overflow
      if (measureContainer.offsetHeight > currentMaxHeight) {
        // Node caused overflow. Remove it from current page.
        currentPage.removeChild(node);

        // If it's a list (UL/OL), we can try to split its children
        if (node.nodeName === 'UL' || node.nodeName === 'OL') {
          const listItems = Array.from(node.childNodes);
          const currentList = document.createElement(node.nodeName);
          // Copy attributes
          Array.from(node.attributes || []).forEach(attr => currentList.setAttribute(attr.name, attr.value));
          currentPage.appendChild(currentList);

          for (let j = 0; j < listItems.length; j++) {
            const li = listItems[j].cloneNode(true);
            currentList.appendChild(li);

            if (measureContainer.offsetHeight > currentMaxHeight) {
              currentList.removeChild(li);
              // Push the current page
              pages.push(currentPage.innerHTML);
              currentPage.innerHTML = '';
              
              // Start a new list on the new page
              const newList = document.createElement(node.nodeName);
              Array.from(node.attributes || []).forEach(attr => newList.setAttribute(attr.name, attr.value));
              newList.appendChild(li);
              currentPage.appendChild(newList);
            }
          }
        } 
        else {
          // For paragraphs or other blocks, if the page is completely empty but the single node 
          // is taller than maxHeight, we must force it on this page to avoid an infinite loop.
          if (currentPage.childNodes.length === 0) {
            currentPage.appendChild(node);
            pages.push(currentPage.innerHTML);
            currentPage.innerHTML = '';
          } else {
            // Push current page and put this node on the next page
            pages.push(currentPage.innerHTML);
            currentPage.innerHTML = '';
            currentPage.appendChild(node);
          }
        }
      }
    }

    // 5. Push the final page if it has content
    if (currentPage.childNodes.length > 0) {
      pages.push(currentPage.innerHTML);
    }

    // Cleanup
    document.body.removeChild(measureContainer);

    // Ensure at least one page is returned
    resolve(pages.length > 0 ? pages : ['']);
  });
};
