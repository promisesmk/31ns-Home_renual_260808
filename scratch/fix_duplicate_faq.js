const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find <div class="faq-accordion-list" id="faq-accordion-container">
  const startMarker = '<div class="faq-accordion-list" id="faq-accordion-container">';
  const endMarker = '<!-- CONTACT';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    console.error(`Could not find markers in ${filePath}`);
    return;
  }

  // Find Q50's ending </div> inside this block
  const q50Index = content.indexOf('Q50.', startIndex);
  if (q50Index === -1 || q50Index > endIndex) {
    console.error(`Could not find Q50 in ${filePath}`);
    return;
  }

  // Find the FIRST closing </div> after Q50, which closes Q50's faq-accordion-item,
  // and the NEXT closing </div> which closes faq-accordion-container!
  let pos = q50Index;
  // find </p>
  const pEnd = content.indexOf('</p>', pos);
  const divInnerEnd = content.indexOf('</div>', pEnd); // faq-answer-inner
  const divBodyEnd = content.indexOf('</div>', divInnerEnd + 1); // faq-answer-body
  const divItemEnd = content.indexOf('</div>', divBodyEnd + 1); // faq-accordion-item
  const divContainerEnd = content.indexOf('</div>', divItemEnd + 1); // faq-accordion-container

  const faqContainerContent = content.substring(startIndex, divContainerEnd + '</div>'.length);

  // Now find where section-block ends after faq-accordion-container
  const sectionEndIndex = content.indexOf('</section>', divContainerEnd);

  // Construct new FAQ section
  const beforeFaq = content.substring(0, startIndex);
  const afterFaqSection = content.substring(sectionEndIndex);

  const cleanSection = faqContainerContent + '\n        </div>\n      </div>\n    </section>\n\n    ';

  const newContent = beforeFaq + cleanSection + afterFaqSection.trimStart();
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Cleaned ${filePath}`);
}

cleanFile(path.join(__dirname, '../index.html'));
cleanFile(path.join(__dirname, '../en/index.html'));
