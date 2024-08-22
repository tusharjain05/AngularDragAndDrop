import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  elements = [
    { type: 'button', label: 'Button', editable: false },
    { type: 'label', label: 'Text Label', editable: true },
  ];

  droppedElements: any[] = [];
  selectedElement: any = null;
  draggedElementIndex: number | null = null;

  onDragStart(event: DragEvent, element: any) {
    this.draggedElementIndex = null;
    event.dataTransfer?.setData('text', JSON.stringify(element));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    const dropZoneRect = (event.target as HTMLElement).getBoundingClientRect();
    const offsetX = event.clientX - dropZoneRect.left;
    const offsetY = event.clientY - dropZoneRect.top;

    const elementData = JSON.parse(event.dataTransfer?.getData('text') || '{}');

    const droppedElement = {
      ...elementData,
      x: offsetX,
      y: offsetY,
      width: elementData.width || 100, // Default width
      height: elementData.height || 50, // Default height
      fontSize: elementData.fontSize || 16, // Retain font size
      fontColor: elementData.fontColor || '#000000', // Retain font color
      bold: elementData.bold || false, // Retain bold state
      buttonText: elementData.buttonText || 'Button',
      buttonColor:
        elementData.type === 'button'
          ? elementData.buttonColor || 'darkviolet'
          : null,
      backgroundColor:
        elementData.type === 'label'
          ? elementData.backgroundColor || 'yellow'
          : null,
      borderRadius: elementData.borderRadius || 5,
      text: elementData.text || 'Edit Text Here', // Preserve text if available
      isEditing: false, // Initial state for editing
    };

    if (this.draggedElementIndex !== null) {
      // Update existing element
      this.droppedElements[this.draggedElementIndex] = droppedElement;
    } else {
      // Add new element
      this.droppedElements.push(droppedElement);
    }

    this.selectedElement = droppedElement;
    this.draggedElementIndex = null; // Reset the dragged element index
  }

  onCanvasDragStart(event: DragEvent, index: number) {
    this.draggedElementIndex = index;
    event.dataTransfer?.setData(
      'text',
      JSON.stringify(this.droppedElements[index])
    );
  }

  onCanvasDragEnd(event: DragEvent) {
    if (this.draggedElementIndex !== null) {
      const dropZone = (event.target as HTMLElement).closest('.drop-zone');
      if (dropZone) {
        const dropZoneRect = dropZone.getBoundingClientRect();
        const offsetX = event.clientX - dropZoneRect.left;
        const offsetY = event.clientY - dropZoneRect.top;

        // Update the position of the dragged element
        this.droppedElements[this.draggedElementIndex].x = offsetX;
        this.droppedElements[this.draggedElementIndex].y = offsetY;

        // Update the selected element to reflect the new coordinates
        this.selectedElement = this.droppedElements[this.draggedElementIndex];
      }

      this.draggedElementIndex = null; // Reset the dragged element index
    }
  }

  enableEditing(index: number) {
    this.droppedElements[index].isEditing = true;
  }

  disableEditing(index: number, event: any) {
    const inputElement = event.target as HTMLInputElement;
    this.droppedElements[index].isEditing = false;
    this.droppedElements[index].text = inputElement.value;
  }

  updateProperty(index: number, property: string, event: any) {
    const value =
      property === 'bold' ? event.target.checked : event.target.value;
    this.droppedElements[index][property] =
      property === 'fontSize' || property === 'borderRadius'
        ? parseFloat(value)
        : value;
  }
  deleteElement(index: number) {
    this.droppedElements.splice(index, 1);
    if (this.selectedElement === this.droppedElements[index]) {
      this.selectedElement = null;
    }
  }

  saveCanvas() {
    console.log("Save button clicked!");
  
    const dropZone = document.querySelector('.drop-zone');
    if (!dropZone) {
      console.error("Drop zone element not found!");
      return;
    }
  
    const elements = dropZone.getElementsByClassName('dropped-item');
    let htmlContent = `<div class="drop-zone" style="position: relative; width: 100%; height: 100%;">\n`;
  
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      const styles = element.style.cssText;
  
      let innerHTML = element.innerHTML.trim();
      if (element.tagName === 'TEXTAREA') {
        innerHTML = `<textarea style="${styles}">${innerHTML}</textarea>`;
      } else if (element.tagName === 'BUTTON') {
        innerHTML = `<button style="${styles}">${innerHTML}</button>`;
      }
  
      htmlContent += `<div style="${styles}">${innerHTML}</div>\n`;
    }
  
    htmlContent += `</div>`;
    console.log("Generated HTML Content: ", htmlContent);
  
    this.downloadHTML(htmlContent, 'canvas.html');
  }
  
  
  downloadHTML(html: string, filename: string) {
    const element = document.createElement('a');
    const file = new Blob([html], { type: 'text/html;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for FireFox
    element.click();
    document.body.removeChild(element);
  }

  getTrailing(element: any): number {
    const dropZone = document.querySelector('.drop-zone') as HTMLElement;
    const trailing = dropZone ? dropZone.clientWidth - (element.x + element.width) : 0;
    return trailing < 0 ? 0 : trailing;
  }
  
  getBottom(element: any): number {
    const dropZone = document.querySelector('.drop-zone') as HTMLElement;
    const bottom = dropZone ? dropZone.clientHeight - (element.y + element.height) : 0;
    return bottom < 0 ? 0 : bottom;
  }


  updateLeading(index: number, event: any) {
    const value = parseFloat(event.target.value);
    this.droppedElements[index].x = value;
    // Update trailing value after changing leading
    this.droppedElements[index].trailing = this.getTrailing(this.droppedElements[index]);
  }
  
  updateTop(index: number, event: any) {
    const value = parseFloat(event.target.value);
    this.droppedElements[index].y = value;
    // Update bottom value after changing top
    this.droppedElements[index].bottom = this.getBottom(this.droppedElements[index]);
  }
  
  updateTrailing(index: number, event: any) {
    const dropZone = document.querySelector('.drop-zone') as HTMLElement;
    const value = parseFloat(event.target.value);
    if (dropZone) {
      this.droppedElements[index].x = value === 0
      ? dropZone.clientWidth - this.droppedElements[index].width
      : dropZone.clientWidth - value - this.droppedElements[index].width;    }
  }
  
  updateBottom(index: number, event: any) {
    const dropZone = document.querySelector('.drop-zone') as HTMLElement;
    const value = parseFloat(event.target.value);
    if (dropZone) {
      const newY = dropZone.clientHeight - value - this.droppedElements[index].height;
      this.droppedElements[index].y = newY < 0 ? 0 : newY;    }
  }
  
  
}
