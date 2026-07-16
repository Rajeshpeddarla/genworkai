from abc import ABC, abstractmethod
from src.models.document import ParsedDocument

class BaseParser(ABC):
    """
    Abstract base class for all parsers.
    Parsers only understand their specific source format (e.g., PDF, DOCX) and output a generic ParsedDocument.
    """
    
    @abstractmethod
    def parse(self, file_path: str, document_id: int) -> ParsedDocument:
        pass
