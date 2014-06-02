package com.wavemaker.runtime.data.jpa.repository;

import java.io.Serializable;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.persistence.metamodel.EntityType;
import javax.persistence.metamodel.Metamodel;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;

import com.wavemaker.runtime.data.jpa.expression.QueryFilter;
import com.wavemaker.runtime.data.jpa.expression.Type;

public class WMJpaRepositoryImpl<T, ID extends Serializable> extends
		SimpleJpaRepository<T, ID> implements WMJpaRepository<T, ID> {

	private EntityManager entityManager;

	public WMJpaRepositoryImpl(Class<T> domainClass, EntityManager entityManager) {
		super(domainClass, entityManager);
		this.entityManager = entityManager;
	}

	@Override
	public Page<T> findAll(Class<T> clazz, QueryFilter[] queryFilters,
			Pageable pageable) {

		Predicate[] predicates = new Predicate[queryFilters.length];
		int counter = 0;

		Metamodel model = entityManager.getMetamodel();
		EntityType<T> entity = model.entity(clazz);

		CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();
		CriteriaQuery<T> criteriaQuery = criteriaBuilder.createQuery(clazz);
		Root<T> root = criteriaQuery.from(entity);

		for (QueryFilter queryFilter : queryFilters) {
			switch (Type.valueOf(queryFilter.getFilterCondition())) {
			case EQUALS: {	
							Predicate predicate = criteriaBuilder.equal(root.get(queryFilter.getAttributeName()),queryFilter.getAttributeValue());
							predicates[counter++] = predicate;
						};	break;
			default:	break;
			}

		}

		criteriaQuery.where(predicates);

		TypedQuery<T> typedQuery = entityManager.createQuery(criteriaQuery);
		List<T> result = typedQuery.getResultList();

		return new PageImpl<T>(result, pageable, result.size());
	}


}
