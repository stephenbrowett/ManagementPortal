package org.radarcns.management.service;

import org.radarcns.management.domain.Role;
import org.radarcns.management.domain.Source;
import org.radarcns.management.domain.User;
import org.radarcns.management.repository.SourceRepository;
import org.radarcns.management.repository.SubjectRepository;
import org.radarcns.auth.authorization.AuthoritiesConstants;
import org.radarcns.management.service.dto.DeviceTypeDTO;
import org.radarcns.management.service.dto.MinimalSourceDetailsDTO;
import org.radarcns.management.service.dto.ProjectDTO;
import org.radarcns.management.service.dto.SourceDTO;
import org.radarcns.management.service.dto.UserDTO;
import org.radarcns.management.service.mapper.ProjectMapper;
import org.radarcns.management.service.mapper.SourceMapper;
import org.radarcns.management.service.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service Implementation for managing Source.
 */
@Service
@Transactional
public class SourceService {

    private Logger log = LoggerFactory.getLogger(SourceService.class);

    @Autowired
    private SourceRepository sourceRepository;

    @Autowired
    private SourceMapper sourceMapper;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private DeviceTypeService deviceTypeService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectMapper projectMapper;

    /**
     * Save a Source.
     *
     * @param sourceDTO the entity to save
     * @return the persisted entity
     */
    public SourceDTO save(SourceDTO sourceDTO) {
        log.debug("Request to save Source : {}", sourceDTO);
        Source source = sourceMapper.sourceDTOToSource(sourceDTO);
        source = sourceRepository.save(source);
        return sourceMapper.sourceToSourceDTO(source);
    }

    /**
     *  Get all the Sources.
     *
     *  @return the list of entities
     */
    @Transactional(readOnly = true)
    public List<SourceDTO> findAll() {
        return sourceRepository.findAll()
            .stream()
            .map(sourceMapper::sourceToSourceDTO)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    public List<Source> findAllUnassignedSources() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        List<String> currentUserAuthorities = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());

        List<Source> sources = new LinkedList<>();
        if(currentUserAuthorities.contains(AuthoritiesConstants.SYS_ADMIN) ||
            currentUserAuthorities.contains(AuthoritiesConstants.EXTERNAL_ERF_INTEGRATOR)) {
            log.debug("Request to get all Sources");
            sources = sourceRepository.findAllSourcesByAssigned(false);
        }
        else if(currentUserAuthorities.contains(AuthoritiesConstants.PROJECT_ADMIN)) {
            log.debug("Request to get Sources of admin's project ");
            String name = authentication.getName();
            Optional<UserDTO> user = userService.getUserWithAuthoritiesByLogin(name);
            if (user.isPresent()) {
                User currentUser = userMapper.userDTOToUser(user.get());
                List<Role> pAdminRoles = currentUser.getRoles().stream()
                    // get all roles that are a PROJECT_ADMIN role
                    .filter(r -> r.getAuthority().getName().equals(AuthoritiesConstants.PROJECT_ADMIN))
                    .collect(Collectors.toList());
                pAdminRoles.stream()
                    .forEach(r -> log.debug("Found PROJECT_ADMIN role for project with id {}",
                        r.getProject().getId()));
                sources.addAll(pAdminRoles.stream()
                    // map them into a list of sources for that project
                    .map(r -> sourceRepository.findAllSourcesByProjectIdAndAssigned(
                        r.getProject().getId(), false))
                    // we have a list of lists of sources, so flatten them into a single list
                    .flatMap(List::stream)
                    .collect(Collectors.toList()));
            }
            else {
                log.debug("Could find a user with name {}", name);
            }
//            sources = sourceRepository.findAllSourcesByProjectIdAndAssigned(currentUser.getProject().getId(), false);
        }
        return sources;
    }
    public List<MinimalSourceDetailsDTO> findAllUnassignedSourcesMinimalDTO() {

        return findAllUnassignedSources().stream()
            .map(sourceMapper::sourceToMinimalSourceDetailsDTO)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    public List<MinimalSourceDetailsDTO> findAllUnassignedSourcesAndOfSubject(Long id) {
        log.debug("Request to get all unassigned sources and assigned sources of a subject");
        List<Source> subjectSources = subjectRepository.findSourcesBySubjectId(id);
        List<Source> sources = findAllUnassignedSources();
        sources.addAll(subjectSources);
        List<MinimalSourceDetailsDTO> result = sources.stream()
            .map(sourceMapper::sourceToMinimalSourceDetailsDTO)
            .collect(Collectors.toCollection(LinkedList::new));
        return result;
    }
    /**
     *  Get one device by id.
     *
     *  @param id the id of the entity
     *  @return the entity
     */
    @Transactional(readOnly = true)
    public SourceDTO findOne(Long id) {
        log.debug("Request to get Source : {}", id);
        Source source = sourceRepository.findOne(id);
        SourceDTO sourceDTO = sourceMapper.sourceToSourceDTO(source);
        return sourceDTO;
    }

    /**
     *  Delete the  device by id.
     *
     *  @param id the id of the entity
     */
    public void delete(Long id) {
        log.debug("Request to delete Source : {}", id);
        sourceRepository.delete(id);
    }

    /**
     * Returns all sources by project in {@link SourceDTO} format
     * @param projectId
     * @return list of sources
     */
    public List<SourceDTO> findAllByProjectId(Long projectId) {
        return sourceRepository.findAllSourcesByProjectId(projectId)
            .stream()
            .map(sourceMapper::sourceToSourceDTO)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Returns all sources by project in {@link MinimalSourceDetailsDTO} format
     * @param projectId
     * @return list of sources
     */
    public List<MinimalSourceDetailsDTO> findAllMinimalSourceDetailsByProject(Long projectId) {
        return sourceRepository.findAllSourcesByProjectId(projectId)
            .stream()
            .map(sourceMapper::sourceToMinimalSourceDetailsDTO)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Returns list of not-assigned sources by project id
     * @param projectId
     * @param assigned
     * @return
     */
    public List<MinimalSourceDetailsDTO> findAllByProjectAndAssigned(Long projectId, boolean assigned) {
        return sourceRepository.findAllSourcesByProjectIdAndAssigned(projectId , assigned)
            .stream()
            .map(sourceMapper::sourceToMinimalSourceDetailsDTO)
            .collect(Collectors.toCollection(LinkedList::new));
    }
}
