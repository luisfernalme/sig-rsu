"""Paginação padrão da API."""
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Paginação por número de página com tamanho ajustável pelo cliente.

    O padrão continua sendo ``PAGE_SIZE`` (20). Telas que precisam da lista
    completa (ex.: mapas e selects do frontend) podem pedir mais itens com
    ``?page_size=N``, limitado a ``max_page_size``.
    """
    page_size_query_param = 'page_size'
    max_page_size = 10000
